<?php
	/**
	 * Stores system configuration constants and includes common use functions which used by add
	 */

	/**
	 * @global string directory to store files uploaded
	 */
	$des_dir = '/var/www/mountdir/';
	/**
	 * @global int interval the dashboard updates information, in second
	 */
	$update_time = 10;
	/**
	 * @global int number of byte that the script should flush the uploaded data to codfs
	 */
	$chunk_size = 4194304;
	$forb_user = array('user', 'session', 'osd');	// forbidden user name, as each user will has it own table name as the username to store his/her history
	
	/**
	 * Class to store the process information
	 *
	 * The process are for mds, monitor and osd. The information include
	 * executable name, path to the executable and the absolute path of the log file
	 */
	class Proc
	{
		/**#@+
		 * @access public
		 * @param string
		 */
		/** name of binary file */
		public $exe_name;
		/** path containing the binary file */
		public $exe_path;
		/** path storing the log file */
		public $log_path;
		/**#@-*/
	
		/**
		 * Constructor
		 *
		 * @param string $name name of binary file
		 * @param string $exe_path path containing the binary file
		 * @param string $log_path path storing the log file
		 */
		function __construct($name, $exe_path, $log_path)
		{
			$this->exe_name = $name;
			$this->exe_path = $exe_path;
			$this->log_path = $log_path;
		}
	}

	// set up of the node information for mds, monitor and osd
	$mds_proc = new Proc('MDS', '/var/www/run/', '/var/www/log/');
	$monitor_proc = new Proc('MONITOR', '/var/www/run/', '/var/www/log/');
	$osd_proc = new Proc('OSD', '/var/www/run/', '/var/www/log/');
	$fuse_proc = new Proc('CLIENT_FUSE', '/var/www/', '/var/www/log');

	$osd_interface = "lo";	// interface used by OSD
	$user = "www-data";	// user start the codfs
	$ssh_timeout = 60;	// timeout of ssh login, to prevent long wait time, specified in second
	$ssh_comm_template = "ssh -i /var/www/.ssh/id_rsa -o ConnectTimeout=${ssh_timeout} ";	// command template for every ssh connection

	// mongodb related
	$mongodb_host = "localhost";	// where the mongodb locate
	$mongodb_port = 27017;	// port of the mongodb uses in connection
	$mongo_codfs_db = "codfs";	// name of db store the codfs information
	$mongo_file_metadata_coll = "FileMetaData";	// name of collection store the metadata

	/*
		Codfs config xml file path
	*/
	$codfs_comm_xml = $monitor_proc->exe_path . 'common.xml';
	$codfs_osd_xml = $osd_proc->exe_path . 'osdconfig.xml';

	/** @var int Component id of the client (The ID which launch the CLIENT) */
	$codfs_client_id = 10;

	/** @var string user defined log file */
	$debug_file = '../log/debug.log';

	/**
	 * Appends the required message into the self-defined log file (not the error log
	 * by apache server) with user friendly format
	 *
	 * @param string $msg Message to be loged in the file
	 */
	function print_log($msg)
	{
		global $debug_file;
		// specify \n since using append mode
		file_put_contents($debug_file, date('d-m-Y H:i:s') . ": $msg\n", FILE_APPEND);
	}

	/*
		Database related
	*/
	$db_user = 'codfs';
	$db_passwd = 'codfs-CLIENT';
	$db_host = 'localhost';
	$db_name = 'codfs';

	/**
	 * Set up a connection to the databse
	 * @return object PDO instance representing a connection to a database
	 */
	function db_login() 
	{
		global $db_user, $db_passwd, $db_host, $db_name;
		// using persistent connections so later connection can reuse it
		return new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_passwd, array(PDO::ATTR_PERSISTENT => true));
	}

	/**
	 * Sets the session token as cookie and stores it into database
	 *
	 * @param string $username User name
	 * @param object $db_handle PDO instance representing a connection to a database
	 */
	function set_sess_cookie($username, $db_handle)
	{
		$session = md5(time());
		$exp = time() + 60*60*24*2;
		setcookie('sess', $session, $exp);	// set it expire after 2 days
		setcookie('user', $username, $exp);	// set it expire after 2 days
		
		// input the record in database
		$stmt = $db_handle->prepare('INSERT INTO session (user, session, expire) VALUES (?, ?, ?)');
		$stmt->execute(array($username, $session, $exp));
	}

	/**
	 * Adds the user actions into the database
	 *
	 * @param object $db_handle PDO instance representing a connection to a database
	 * @param string $table The table name storing the user history
	 * @param string $action The action user preformed
	 */
	function add_log($db_handle, $table, $action)
	{
		$stmt = $db_handle->prepare("INSERT INTO $table (time, log) VALUES (?, ?)");

		$stmt->execute(array(time(), $action));
	}

	/**
	 * Input size in format 1.23G or 1.09T or 2.00T and return the size in GB
	 * 
	 * @param string $size file size
	 * @return float size in GB
	 */
	function get_size_GB($size)
	{
		// check if the capacity is in G/T/P
		$mult = 1;
		switch(substr($size, -2))	// the last two char in the string is the unit
		{
			case 'GB':
				break;
			case 'TB':
				$mult = 1024;
				break;
			case 'PB':
				$mult = 1048576;
				break;
		}	// end of switch

		return floatval(substr($size, 0, -2)) * $mult;
	}

	/**
	 * Validates the session token and session against database, if not valid, server expires the
	 * cookie containing the session token
	 *
	 * @param string|void $username User name
	 * @param string|void $session Session Token
	 * @return boolean Returns true if the session token is valid, else returns false. Also returns
	 * 				   false if there is no session token input.
	 */
	function check_session($username, $session)
	{
		// if the input argument has something, if nothing, then there is no cookie
		if($username == '' || $session == '')
			return false;

		// check if session exist in db
		$db_handle = db_login();
		$stmt = $db_handle->prepare('SELECT * FROM session WHERE user=? and session=?');
		$stmt->execute(array($username, $session));
		$result = $stmt->fetch(PDO::FETCH_ASSOC);
		$curr = time();

		// check for the session expire
		// check if there is record first, if not check php will crash
		if($result && $curr < $result['expire'])
			return true;
		else // the cookie is expired
		{
			// expire the cookie
			setcookie('sess', '', 0);
			setcookie('user', '', 0);

			return false;
		}
	}

	/**
	 * Validates the session, if not valid, it will redirect user back to login page
	 *
	 * @param $username User name
	 * @param $session session token
	 * @return boolean Returns true if the session token is valid
	 */
	function validate_session($username, $session)
	{
		// redirect back to login page if no valid session found
		if(check_session($username, $session) === false)
		{
			header("Location: http://" . $_SERVER['HTTP_HOST'] . '/login.html', true, 302);
			// not to display more content
			exit;
		}
		else
		{
			// session exist
			return true;
		}
	}

	/**
	 * Display 404 page with status code 404 without causing the change of URL
	 */
	function redirect_404()
	{
		header('HTTP/1.0 404 Not Found');
		include('404.html');
		exit();
	}
?>
