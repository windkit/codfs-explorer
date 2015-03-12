<?php
	// to handle all the upload file in server side
	require_once("config.php");
	// relative path of the directory to upload the file
	$curr_rpath = $_GET['curr_rpath'];
	// file name of the file to be uploaded
	$file_name = $_GET['name'];
	// id of uploaded chunk, started from 0 to total number of chunk -1
	$chunk_id = intval($_GET['chunk_id']);
	$total_num_chunk = intval($_GET['total_chunk']);
	// size of the chunk uploaded
	$upload_size = intval($_GET['chunk_size']);
	// total file size
	$file_size = intval($_GET['total_size']);
	$lm_time = "";	// last modified time
	$unix_time = 0;
	// absolute path of the directory to upload file
	$des_dir = $des_dir . $curr_rpath . '/';

	// record start time and end time of the the upload file, in second
	$start = $end = 0;
	$ret_arr = array('name' => $file_name);

	// issue write instead of append, since if there is same name file exist
	// 'w' mode can truncate it
	if($chunk_id === 0)
	{
		$file_write_handle = fopen($des_dir . $file_name, 'wb');

		// log back the action in db
		add_log(db_login(), $_COOKIE['user'], "Upload file $file_name");
	}	// end of if()
	else
		$file_write_handle = fopen($des_dir . $file_name, 'ab');
		
	$file_read_handle = fopen('php://input', 'rb');	// read from request

	if($file_read_handle === false)
	{
		$ret_arr['result'] = 1;
		$ret_arr['msg'] = 'Cannot get read handle';
		goto END;
	}

	if($file_write_handle === false)
	{
		$ret_arr['result'] = 2;
		$ret_arr['msg'] = 'Cannot get write handle';
		goto END;
	}

#	print_log("Flushing data| file: $file_name | with id: $chunk_id");
	$start = microtime(true);
	// core of file read / write
	while(!feof($file_read_handle))
	{
		/*
		 * Specify the $chunk_size to do chunking
		 * Not using fread() then fwrite approach as stream is read buffered and it does not represent a plain file,
		 * the chunk size read usually is 8192, which we cannot control how many read, so use another function
		 */
		stream_copy_to_stream($file_read_handle, $file_write_handle, $chunk_size);
	}	// end of while()
	
	fflush($file_write_handle);
	fclose($file_read_handle);
	fclose($file_write_handle);
	// record the end time after fclose() to ensure all data is flushed to disk
	$end = microtime(true);

	// only query for the last chunk
	if($chunk_id == $total_num_chunk -1 )
	{
		$f_info = stat($des_dir . $file_name);
		$unix_time = $f_info['mtime'];
		$lm_time = date('j-n-Y H:i:s', $unix_time);

		$ret_arr['lm_time'] = $lm_time;
		$ret_arr['unix_time'] = $unix_time;
	}

	$ret_arr['up_time'] = $end - $start;
	$ret_arr['result'] = 0;
	$ret_arr['msg'] = 'succeed';

 // 	$ret_arr = array('result' => $result, 'name' => $file_name, 'msg' => $msg, 'up_time' => ($end - $start), 'lm_time' => $lm_time, 'unix_time' => $unix_time);

END:
	echo json_encode($ret_arr);
?>
