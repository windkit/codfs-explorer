<?php
	/**
	 * To respond on server probing, which query the CodFS if in recovery
	 * Return CodFS status, to check if it is in recovery
	 * Return recovery time if server finished recovery
	 */
	include('config.php');
	$ret = $time = 0;
	/*
		Log file to store the recoery if in recovery or not
		1 -> in recovery
		0 -> no recovery found yet
	*/
	$rec_prog_file = '/tmp/rec_prog.log';

	// find out where is the MONITOR and MDS by parsing the xml
	$xml = simplexml_load_file($codfs_comm_xml);
	/* MONITOR info */
	$monitor_xml = $xml->Components->MONITOR;
	$num_monitor = $monitor_xml->count;
	/* MDS info */
	$mds_xml = $xml->Components->MDS;
	$num_mds = $mds_xml->count;

	// prepare for the log file to store recovery or not
	// default value is 0
	if(!file_exists($rec_prog_file))
		file_put_contents($rec_prog_file, 0);

	// in recovery, we query mds directly
	if((int)file_get_contents($rec_prog_file) == 1)
	{
		// check when the codfs has finished recover
		if(($status = query_mds($mds_xml, $num_mds)) > -100)
		{
			if($status >= 0)	// finished recovery
			{
				// reset it as finish recovery
				file_put_contents($rec_prog_file, 0);
				$ret = 2;
				$time = $status;
				goto END;

			 }
			 else 	// in recovery
			 {
			 	$ret = 1;
				goto END;
			 }
		}
	}
	else
	{
		// we check for monitor to see if there is recovery
		if(query_monitor($monitor_xml, $num_monitor) == 1)
		{
			// update revoery progress log to in recovery
			file_put_contents($rec_prog_file, 1);

			$ret = 1;
			goto END;
		}
	}


END:
	echo json_encode(array('ret' => $ret, 'time' => $time));


	//----------------- function --------------------
	/**
	 * Query monitor and check if CodFS is in recovery or not by parsing log file of monitor using shell script
	 * @param object $monitor_xml SimpleXMLElement object of the loaded xml file, pointed to monitor component
	 * @param int $num_monitor Number of monitor in the system
	 * @return int The progress of CodFS recovery or -1 if problem occur in CodFS
	 */
	function query_monitor($monitor_xml, $num_monitor)
	{
		global $monitor_proc;
		global $ssh_comm_template, $user;
		$exe_name = $monitor_proc->exe_name;
		$log_path = $monitor_proc->log_path;
		$exe_path = $monitor_proc->exe_path;

		// in the field of MONITOR, the number is started from 0
		for($i = 0; $i < $num_monitor; $i++)
		{
			$name = 'MONITOR' . $i;
			// get the xml object which is about the current monitor
			$monitor = $monitor_xml->$name;
			$ssh_comm = $ssh_comm_template . " $user@$monitor->ip " . " bash -s < ./get_health.sh $exe_name {$log_path}{$exe_name}.log {$exe_path}monitor.rec";
			$ssh_ret = exec($ssh_comm);

			// cannot find any record in this ip, try next monitor instead
			if($ssh_ret < 0)
				continue;

			// we know it is in recovery or not, so return it
			return $ssh_ret;
		}

		// if all nodes are failed
		return -1;
	}

	/**
	 * Query each mds for the recovery status by parsing the log in mds using shell script
	 * @param object $mds_xml SimpleXMLElement object of the loaded xml file pointed to mds component
	 * @param int $num_mds Number of mds in the system
	 * @return int Return progress of recovery
	 */
	function query_mds($mds_xml, $num_mds)
	{
		global $mds_proc;
		global $ssh_comm_template, $user;
		$exe_name = $monitor_proc->exe_name;
		$log_path = $monitor_proc->log_path;
		$exe_path = $monitor_proc->exe_path;

		// the MSD field in the log file is started from 0
		for($i = 0; $i < $num_mds; $i++)
		{
			$name = 'MDS' . $i;
			// get the xml object which is about the current mds
			// which include component id, ip and port used
			$mds = $mds_xml->$name;
			$ssh_comm = $ssh_comm_template . " $user@$mds->ip " . " bash -s < ./get_recovery_progress.sh  $exe_name {$log_path}{$exe_name}.log {$exe_path}mds.rec";
			$ssh_ret = exec($ssh_comm);

	print_log('ssh_ret: ' . $ssh_ret);
			// cannot find any record in this ip, try next mds instead
			if($ssh_ret == -3)
				return -1;	// not yet finished recovery
			else if($ssh_ret >= 0)
					return $ssh_ret;	// return the recovery time
				  else
				  	continue;	// there is some problem in the current mds node, so finding the next one
		}

		// if all nodes are failed
		return -2;
	}
?>
