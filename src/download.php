<?php
	/*
		to handle all the download request from web cleint
	*/
	include("config.php");

	// file to be downloaded, our target file
	$file_name = $_GET["req_name"];
	// relative dirctory of the target file
	$curr_rpath = $_GET['curr_rpath'];
	// absolute path of the target file
	$apath_file = $des_dir . $curr_rpath . '/' . $file_name;

	add_log(db_login(), $_COOKIE['user'], "Download file $file_name");
	// check if file exists or not
	if(!file_exists($apath_file))
		exit();

	// send the file to client
	header('Content-Description: File Transfer');
	header('Content-Type: application/octet-stream');
	header('Content-Transfer-Encodin: binary');
	header('Content-Length: ' . filesize($apath_file));
	// file name must embadded with " to allow browser (firefox) reconizes the file name has mulit spaces in download
	header('Content-Disposition: attachment; filename=' . '"' . $file_name . '"');

	// this call will first load teh whole file into memory
	readfile($apath_file);
?>
