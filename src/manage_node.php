<?php
	/**
	 * This file resposible for adding or remove osd in codfs system
	 *
	 * When mode = 1, it is adding OSD
	 * When mode = -1, it is removing OSD
	 *
	*/
	include("config.php");

	$ip = $_POST['ip'];	// array of IP to be added/removed
	$mode = $_POST['mode'];	// which operation to be preformed
	$osd_ids = $_POST['id'];	// compontent id of OSD to add or remove

	$add_comm = "stdbuf -oL ";	// force the output to be line buffer during IO redirection
	$ret_val = 0;	// default return value
	$ret_msg = "success";	// default return msg
	$update_node = array();

	$proc_name = $osd_proc->exe_name;

	// check if user really enter ip and id, not allow user to modify the JS and html to by pass it
	if(isset($_POST['ip'], $_POST['id']) === false)
	{
		$ret = -1;
		$msg = 'Cannot receive any ip and id';
	}

	if($mode > 0)	// add node
	{
		$ssh_comm = $ssh_comm_template . " $user@$ip ";

		// $log_path -> where to save the log
		// $exe_path -> path of the executable
		$log_path = $osd_proc->log_path;
		$exe_path = $osd_proc->exe_path;

		if(check_comp_id($osd_ids) === false)
		{
			$msg = 'Cannot use the component id ' . $osd_ids;
			$ret = -2;
			goto END;
		}
		$id = $osd_ids;
		//$id = next_comp_id();
		// cd to directory first because if direct call, the program cannot find xml file
		$ssh_comm .= " 'cd $exe_path; nohup $add_comm $exe_path$proc_name $id $osd_interface" . " > $log_path{$proc_name}_${id}.log 2> $log_path{$proc_name}_${id}.err &'";
		exec($ssh_comm, $ssh_res, $ssh_ret);

		// failed to start the process
		if($ssh_ret != 0)
		{
			$ret_val = 2;
		}
		else
		{
			// prepare to insert the new added node into db
			$db_handle = db_login();
			$stmt = $db_handle->prepare('INSERT INTO osd (ip, port, id) VALUES (?,?,?)');

			$ssh_comm = $ssh_comm_template . "$user@$ip ";

			exec($ssh_comm . " ' sed -n -e \"4p\" -e \"6p\" $osd_proc->log_path{$osd_proc->exe_name}_${id}.log'", $temp_res, $temp_ret);
			// not support in php 5.3, for the notation of foo()[]
			// $temp = explode(' ', $temp_res[0])[3];	// to extrat the part 1.81GB/10GB
			$temp = explode(' ', $temp_res[0]);	$temp = $temp[3];	// to extrat the part 1.81GB/10GB
			$temp = explode('/', $temp);	// to extrat the part 1.8GB and 10GB
			$cap = get_size_GB($temp[1]);
			$used = get_size_GB($temp[0]);
			$free = $cap - $used;

			$update_node['free'] = $free;
			$update_node['cap'] = $cap;
			print_log("cap: $cap | free: $free | used: $used");

			// not support in php 5.3, for the notation of foo()[]
			// $port = trim(explode('=', $temp_res[1])[1]);
			$port = explode('=', $temp_res[1]);	$port = trim($port[1]);

			// add back the result into db so we can track if it is connected or not
			$stmt->execute(array($ip, $port, $id));

			$update_node['id'] = $id;
			$update_node['ip'] = $ip;
			$update_node['port'] = $port;
		}	// end of else
	}	// end of if(mode > 0)
	else	// remove the node
	{
		// report which node added successfully and which fail to start
		$rm_node = array();
		// prepare to remove record form db
		$db_handle = db_login();
		$stmt = $db_handle->prepare('DELETE FROM osd WHERE ip=? AND id=?');

		for($i = 0, $len = count($ip); $i < $len; $i++)
		{
			// since the OSD need to specify the component id, as one node can run many OSD
			$proc = $osd_proc->exe_name . ' ' .  $osd_ids[$i];

			$_ip = $ip[$i];

			$exec_comm = $ssh_comm_template . "$user@$_ip " . " 'pkill -f \"$proc\"'";
			print_log("kill comm: " . $exec_comm);
			// not check return value since it will always return none 0 even on success
			exec($exec_comm);

			$stmt->execute(array($_ip, $osd_ids[$i]));

			$temp_arr = array('ip' => $_ip, 'id' => $osd_ids[$i]);

			array_push($rm_node, $temp_arr);

		}	// end of for

		$update_node = $rm_node;
	}	// end of else in if(mode > 0)

END:
	echo(json_encode(array('ret' => $ret_val, 'msg' => $ret_msg, 'node_info' => $update_node)));


	/**
	 * Generate component id
	 *
	 * Generate component id by finding the largest component id of mds, monitor, clinet fuse and all the osd
	 * @return int return the largest + 1 of the current using component id
	 */
	function next_comp_id()
	{
		global $codfs_client_id, $codfs_comm_xml;
		$db_handle = db_login();
		$max_id = -1;

		// check for the component id of mds and monitor and client fuse
		if(($xml = simplexml_load_file($codfs_comm_xml)) !== false)
		{
			$monitor_id = $xml->Components->MONITOR->MONITOR0->id;
			$mds_id = $xml->Components->MDS->MDS0->id;

			$max_id = max(array($monitor_id, $mds_id, $codfs_client_id));
		}

		$query = 'SELECT MAX(id) AS max_id FROM osd';	// cannot put 'AS ...' at the end of query, if at the end, will be the return array will be $row['MAX(..)']
		foreach($db_handle->query($query) as $row)
			if($row['max_id'] > $max_id)
				$max_id = $row['max_id'];

		return $max_id + 1;
	}

	/**
	 * Check if the entered component id is used and the id is an int type with value larger than 1
	 *
	 * @param int $id component id to be checked
	 * @return bool Return true if the Component id had not been used
	 */
	function check_comp_id($id)
	{
		// web client may by pass the restraction of the component id
		if(is_numeric($id) === false || $id < 1)
			return false;

		global $codfs_client_id, $codfs_comm_xml;
		$db_handle = db_login();

		// check for the component id of mds and monitor and client fuse
		if(($xml = simplexml_load_file($codfs_comm_xml)) !== false)
		{
			$monitor_id = $xml->Components->MONITOR->MONITOR0->id;
			$mds_id = $xml->Components->MDS->MDS0->id;

			if($id == $monitor_id || $id == $mds_id || $id == $codfs_client_id)
				return false;
		}

		$query = 'SELECT MAX(id) AS max_id FROM osd';	// cannot put 'AS ...' at the end of query, if at the end, will be the return array will be $row['MAX(..)']
		foreach($db_handle->query($query) as $row)
			if($row['max_id'] == $id)
				return false;

		return true;
	}
?>
