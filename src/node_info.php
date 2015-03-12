<?php
	/**
	 * To get the monitor, mds and osd status and return to client
	 *
	 * This PHP file works with shell script to get the status
	 */
	include('config.php');

	$ret = 0;	// return value of the ajax request
	$msg = "succeed";	// error message of the ajax request
	$mds_info = $monitor_info = $osd_info = $online_osds = null;

	// cannot find the xml file
	if(($xml = simplexml_load_file($codfs_comm_xml)) === false)
	{
		$ret = 4;
		goto END;
	}

	//the node name of monitor and mds in the xml current only hard code 1 monitor and 1 mds
	$monitor_type = "MONITOR0";
	$mds_type = "MDS0";
	$monitor_xml = $xml->Components->MONITOR->$monitor_type;
	$mds_xml = $xml->Components->MDS->$mds_type;

	// Store the result found found in xml
	$monitor_info = array('id' => (int)$monitor_xml->id,
						  'ip' => (string)$monitor_xml->ip,
						  'port' => (int)$monitor_xml->port);
	$mds_info = array('id' => (int)$mds_xml->id,
					  'ip' => (string)$mds_xml->ip,
					  'port' => (int)$mds_xml->port);

	// to get list of osds id, ip and port from database
	if(($osd_info = fetch_osd()) === false)
	{
		$ret = 6;
		$msg = "Cannot find OSD record in database";
		goto END;
	}

	//--------------- MONITOR CHECKING ----------------
	$online_osds = parse_monitor_log($monitor_info['ip']);
	switch($online_osds)
	{
		case 1:
			$ret = 1;
			$msg = "No process $monitor_proc->exe_name has launched";
			goto END;
		case -1:
			$ret = -1;
			$msg = "Log file $monitor_proc->log_path{$monitor_proc->exe_name}.log cannot be found";
			goto END;
	}

	// convert IP to human readable format
	for($i  = 0, $len = count($online_osds); $i < $len; $i++)
		$online_osds[$i]['ip'] = conv_ip($online_osds[$i]['ip']);

	//--------------- MDS CHECKING ----------------
	// check if the mds process exists
	if(process_check($mds_proc->exe_name, $mds_info['ip']) === false)
	{
		$ret = 2;
		$msg = "NO process $mds_proc->exe_name has launched";
		goto END;
	}

	//----------- parse the OSDs log -----------
	// find the disconnected OSD
	$disconn_osds = find_offline_osd($osd_info, $online_osds);

	// find new record of osd and add back to the database
	$new_osd = find_offline_osd($online_osds, $osd_info);
	$db_handle = db_login();
	$stmt = $db_handle->prepare("INSERT INTO osd (ip, port, id) VALUES (?,?,?)");
	for($i = 0, $len = count($new_osd); $i < $len; $i++)
		$stmt->execute(array($new_osd[$i]['ip'], $new_osd[$i]['port'], $new_osd[$i]['id']));

	//-------- query each OSD default capacity --------
	for($i = 0, $len = count($online_osds); $i < $len; $i++)
	{
		// if 'cap' set to -1, it means cannot find the log file
		$online_osds[$i]['cap'] = parse_osd_log($online_osds[$i]);
		$online_osds[$i]['free'] /= 1024;
	}	// end of for

	// mark the offline osds as offline and add back to result
	for($i = 0, $len = count($disconn_osds); $i < $len; $i++)
	{
		$disconn_osds[$i]['free'] = -1;
		array_push($online_osds, $disconn_osds[$i]);
	}
	$osd_info = $online_osds;

END:
	/*
	   The output is in the following format:
	   $ret -> return value
	   $msd -> associative array {ip: IP, port: port, id: component id}
	   $monitor -> associative array {ip: IP, port: port, id: component id}
	   $osd -> array, array of osd infomration: [0] => {ip: .., port: .., id: .., free: .., cap: ..},
	           note: free = -1 -> offline, cap = -1 -> cannot find log file
	   $msg -> string, error message of the operation
	 */
	echo json_encode(array('ret' => $ret, 'mds' => $mds_info, 'monitor' => $monitor_info, 'osd' => $osd_info ,'msg' => $msg));


	//================== fucntions ==================
	/**
	 * Gets the osd note information stored in database
	 *
	 * @return Array|bool An array which specify the ip, port and id of osd from database, false if osd record not found
	 */
	function fetch_osd()
	{
		$res_arr = array();
		$db_handle = db_login();
		$stmt = $db_handle->prepare("SELECT * FROM osd");
		$stmt->execute();
		$db_result = $stmt->fetch(PDO::FETCH_ASSOC);

		if(!$db_result)
		{
			return false;
		}
		else
		{
			// keep fetching information
			while($db_result !== false)
			{
				array_push($res_arr, array("ip" => $db_result['ip'], "port" => $db_result['port'], "id" => $db_result['id']));
				$db_result = $stmt->fetch(PDO::FETCH_ASSOC);
			}	// end of while

			return $res_arr;
		}	// end of else
	}	// end of fetch_osd()

	/**
	 * Gets all the online OSDs by parsing the monitor log file and returns associative array
	 *
	 * @param string $ip IP of the monitor node
	 * @return int|Array Return 1 if no process found. Return -1 if no log file is found. Return Array of online OSD
	 */
	function parse_monitor_log($ip)
	{
		global $monitor_proc, $user, $ssh_comm_template;	// from config.php

		// check if the MONITOR process is present
		if(process_check($monitor_proc->exe_name, $ip) === false)
			return 1;

		// pharse the log file to get information of online OSD
		// The shell script: get_osd_info.sh is in php server instead of in monitor
		$ssh_comm = $ssh_comm_template . " $user@$ip bash -s < ./get_osd_info.sh $monitor_proc->log_path{$monitor_proc->exe_name}.log";
		exec($ssh_comm, $ssh_res, $ssh_ret);

		if($ssh_ret == 3)	// no osd found, return empty array instead
			return array();

		if($ssh_ret >  0)	// no log file exist, check by the shell script
			return -1;

		// pharse it as associative array
		$osd_info = json_decode($ssh_res[0], true);
		return $osd_info;
	}	// end of parse_monitor_log()

	/**
	 * Parses the osd log file and returns the total capacity of osd
	 *
	 * @param Array $osd Associative array of an osd node
	 * @return int Total capacity of the OSD note in GB or -1 if cannot find log file
	 */
	function parse_osd_log($osd)
	{
		global $osd_proc, $user, $ssh_comm_template;  // from config.php

		if(is_log_exist($osd['ip'], "{$osd_proc->log_path}{$osd_proc->exe_name}_{$osd['id']}.log") == false)
			return -1;

		$ssh_comm = $ssh_comm_template . " $user@${osd['ip']} " . "'sed -u -n 2p {$osd_proc->log_path}{$osd_proc->exe_name}_${osd['id']}.log | cut -d '=' -f 3'";
		exec($ssh_comm, $ssh_res, $ssh_ret);
		$ssh_res = trim($ssh_res[0]);	// to avoid leading space

		return get_size_GB($ssh_res);
	}	// end of parse_osd_log()

	/**
	 * Checks if there is any process specified by $proc in the remote host $ip
	 *
	 * @param string $proc Process name to be check
	 * @param string $ip IP of the machine for carrying out the process check
	 * @return bool Return true of the process exists, else returns false
	 */
	function process_check($proc, $ip)
	{
		global $ssh_comm_template, $user;	// from config.php
		$ssh_comm = $ssh_comm_template . " $user@$ip 'ps aux | grep \"$proc\" | grep -v grep'";
		exec($ssh_comm, $tmp_out, $tmp_ret);

		if($tmp_ret != 0)
		{
			// cannot find the process, we should prompt warning
			return false;
		}

		return true;
	}	// end of process_check()

	/**
	 * Convert big endian ip into human readable format by using bit shifting
	 *
	 * @param string $big_endian_ip IP in big endian
	 * @return string Return IP in human readable format
	 */
	function conv_ip($big_endian_ip)
	{
		$ip = intval($big_endian_ip, 10);
		$res = "";

		for($i = 0; $i < 3; $i++)
		{
			$res .= ($ip & 255) . ".";
			$ip >>= 8;
		}
		$res .= ($ip & 255);

		return $res;
	}	// end of conv_ip()

	/**
	 * Find the offline osd from $a by comparing the online list in $b
	 *
	 * @param Array $a Array of osd information
	 * @param Array $b Array of online osd information
	 * @return Array Array of offline osd information
	 */
	function find_offline_osd($a, $b)
	{
		$offline_osds = array();

		// loop through all the osd info from $a and compare to $b, find not in $b, then
		// add to $offline_osds
		for($i = 0, $len_a = count($a); $i < $len_a; $i++)
		{
			for($j = 0, $len_b = count($b); $j < $len_b; $j++)
			{
				if($a[$i]['ip'] == $b[$j]['ip'] && $a[$i]['port'] == $b[$j]['port'] || $a[$i]['id'] == $b[$j]['id'])
					goto END_J;	// since the record is found, exit the loop and start finding next i;

			}	// end of for $j
			array_push($offline_osds, $a[$i]);
	END_J:

		}	// end of for $i

		return $offline_osds;
	}	// end of find_offline_osd()

	/**
	 * Checks if log file specified by path in specified IP exists
	 *
	 * @param string $ip IP address of the remote machine
	 * @param string $path Absolute path of the log file
	 * @return bool Return ture if log file is found, else return false
	 */
	function is_log_exist($ip, $path)
	{
		global $user, $ssh_comm_template;
		// pipe to /dev/null to prevent the error msg appear in the apache log
		$comm = $ssh_comm_template . " $user@$ip 'ls $path 2> /dev/null'";
		exec($comm, $out, $ret);
		if($ret != 0)
			return false;
		else
			return true;
	}	// end of is_log_exist()
?>
