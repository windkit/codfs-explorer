<?php
	/*
		To search the file which the file name match the keyword specifies by user
		The search is case insensitive search
	*/
	include('config.php');
	$filename = $_POST['filename'];

	// final resultuant json of the result file
	$res_json = array();

	// connect to mongodb
	$mongo = new MongoClient('mongodb://' . $mongodb_host . ':' . $mongodb_port);
	// select codfs database
	$mongodb = $mongo->$mongo_codfs_db;
	// select FileMetadata collection
	$coll = $mongodb->$mongo_file_metadata_coll;

	// not allow user to search the file with path specified, since / is used in path only
	if(strstr($filename, '/') !== false)
		goto END;

	// escape the regular expression character in the file name
	$filename = preg_quote($filename, '/');

	// to find the file name which contain the word: $filename
	$query = "{$filename}[^/]*\$";
	$result = $coll->find(array('path' => array('$regex' => $query, '$options' => 'i'), 'clientId' => $codfs_client_id));


	// store back the result
	foreach($result as $i)
	{
		$ret = $i['path'];
		// find the last occur of the /
		$index = strrpos($ret, '/');
		// name of the target files
		$name = substr($ret, $index + 1);	// +1 to skip the '/'
		// path of the target file
		$path = substr($ret, 0, $index + 1);	// +1 to include '/'
		array_push($res_json, array('name' => $name, 'path' => $path));
	}

END:
	// return the resultant json of found file and the keyword we search
	echo json_encode(array('result' => $res_json, 'search_str' => $filename));
?>
