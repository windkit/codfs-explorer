<?php
	/**
	 * Removes lists of files and empty directories
	 */

	require_once("config.php");
	// array of file / directory name to be removed
	$files = $_POST["rm_file"];
	$curr_rpath = $_POST['curr_rpath'];	// relative path of the current directory
	// For adding user history
	$db_handle = db_login();
	$user = $_COOKIE['user'];

	// connect to mongodb
	$mongo = new MongoClient('mongodb://' . $mongodb_host . ':' . $mongodb_port);
	// select codfs database
	$mongodb = $mongo->$mongo_codfs_db;
	// select FileMetadata collection
	$coll = $mongodb->$mongo_file_metadata_coll;

	$result = array();
	// remove the files and directory
	for($i = 0, $len = count($files); $i < $len; $i++)
	{
		$temp_arr = array('name' => $files[$i]);
		// $curr_rpath is array is user remove files in search
		if(is_array($curr_rpath))
		{
			$temp_arr['path'] = $curr_rpath[$i];
			$file = $des_dir . $curr_rpath[$i] . '/' . $files[$i];
		}
		else
			$file = $des_dir . $curr_rpath . '/' . $files[$i];

		$is_dir = is_dir($file);

		// unlink cannot be used in directory
		if($is_dir)
			// hide the error due to remove non-empty directory
			$ret = @rmdir($file);
		else
			$ret = unlink($file);

		if($ret)
		{
			// only file has entry in mongodb
			if($is_dir === false)
			{
				// replace multi '/' into a single '/', e.g. '/dir//dir2///file' becomes '/dir/dir2/file'
				// the $curr_rpath is array if it is removed in search result
				if(is_array($curr_rpath))
					$entry = preg_replace('/\/+/', '/', $curr_rpath[$i] . '/' . $files[$i]);
				else
					$entry = preg_replace('/\/+/', '/', $curr_rpath . '/' . $files[$i]);
				$coll->remove(array('path' => $entry, 'clientId' => $codfs_client_id));
			}
			$temp_arr['res'] = 0;
			add_log($db_handle, $user, "Remove file/dir $i");
		}
		else
		{
			// addd back the '/' to indicate it is a dir
			if($is_dir === true)
			{
				$temp_arr['name'] .= '/' . ' is a non-empty folder';
			}
			$temp_arr['res'] = 1;
		}

		array_push($result, $temp_arr);
	}

	// result formatei {0=>{name: filename, res: return value, [path: path of the file, only available for remove searching]}}
	echo json_encode($result);
?>
