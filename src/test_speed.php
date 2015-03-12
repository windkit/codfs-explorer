<?php
	/**
	 * Test read /  write speed of OSD
	 */
	include("config.php");

	$ret = 0;
	// block size in number of byte
	$bs = intval($_POST['bs_size']) * 1024;
	// number of block
	$num_bk = intval($_POST['num_bk']);
	// total size of the data chunk used in testing
	$total_size = $bs * $num_bk;
	$read_speed = -1;
	$write_speed = -1;

	// limit the test size to be 512MB
	if($bs * $num_bk > 536870912)
	{
		$bs = 1048576;
		$num_bk = 512;
	}

	// prepare test file by random generate filename and random data
	$source = tempnam('/tmp', 'temp');
	$des1 = tempnam($des_dir, 'temp');
	$des2 = tempnam('/tmp', 'temp');
	// redirct the dd msg to null as it will appear in apache log
	exec("dd if=/dev/urandom of=$source bs=$bs count=$num_bk 2> /dev/null");

	/*
	 * -----------
	 * test write
	 * -----------
	 */
	// strat time of read file in second
	// microtime(true) -> Return current Unix timestamp in floating point
	$start_t = microtime(true);
	// error in copying file
	if(copy($source, $des1) === false)
	{
		$ret = 1;
		clean_up();
		goto END;
	}
	// end time of write file in second
	$end_t = microtime(true);
	$write_speed =  $total_size / ($end_t - $start_t);

	/*
	 * -----------
	 * test read
	 * -----------
	 */
	$start_t = microtime(true);
	if(copy($des1, $des2) === false)
	{
		$ret = 2;
		clean_up();
		goto END;
	}
	$end_t = microtime(true);
	$read_speed =  $total_size / ($end_t - $start_t);

	// remove the test file
	clean_up();

END:
	// the return IO speed is in byte per second
	echo(json_encode(array('ret' => $ret, 'read' => $read_speed, 'write' => $write_speed)));
	

	/**
	 * Removes all the temp files
	 */
	function clean_up()
	{
		global $source, $des1, $des2;
		unlink($des1);
		unlink($des2);
		unlink($source);
	}
?>
