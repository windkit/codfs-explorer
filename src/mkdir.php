<?php
	/**
	 * Creates directories in path specified by user
	 */
	include('config.php');

	$dir_name = $_POST['dir_name'];	// directory name
	$curr_rpath = $_POST['curr_rpath'];	// relative path to create directory
	$path = $des_dir . $curr_rpath . '/';	// absolute path of the destination
	$d_size = $d_lm_time = "";	// size and last modified time
	$ret = 0;
	$unix_time = 0;
	$msg = "";

	// illegal character had been found in server side
	if(preg_match('/[\\\\\/:?&<>"\'|]/', $dir_name) == 1)
	{
		$msg = 'Folder name contains illegal character';
		$ret = 1;
		goto END;
	}

	// to create the direcotry according to the location specified
	if(@mkdir($path . $dir_name) === false)
	{
		$ret = 1;
		$msg = "Cannot create folder $dir_name";
		goto END;
	}

	// fetch directory information
	$f_info = stat($path . $dir_name);
	$d_size = $f_info["size"] / (1024 * 1024);
	$unix_time = $f_info['mtime'];
	$d_lm_time = date('j-n-Y H:i:s', $unix_time);

END:
	echo json_encode(array('ret' => $ret, 'size' => $d_size, 'lm_time' => $d_lm_time, 'unix_time' => $unix_time, 'msg' => $msg));
?>
