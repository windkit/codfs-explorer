<?php
	/**
	 * Returns web page to provide OSD read/write speed test
	 *
	 * The page provides interface to use to input block size and number of blocks to test
	 */
	include('config.php');
	$username = @$_COOKIE['user'];
	$session = @$_COOKIE['sess'];

	validate_session($username, $session);
?>
<!DOCTYPE html>
<!-- using sb admin (ref: http://startbootstrap.com/template-overviews/sb-admin/)-->
<html lang="en">

<head>

  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="">
  <meta name="author" content="">

  <title>CodFS Explorer Admin Paneli - Speed Test</title>

  <!-- Bootstrap Core CSS -->
  <link href="css/bootstrap.min.css" rel="stylesheet">

  <!-- Custom CSS -->
  <link href="css/sb-admin.css" rel="stylesheet">

  <!-- Custom Fonts -->
  <link href="css/font-awesome.min.css" rel="stylesheet" type="text/css">

  <!-- HTML5 Shim and Respond.js IE8 support of HTML5 elements and media queries -->
  <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
  <!--[if lt IE 9]>
    <script src="https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js"></script>
    <script src="https://oss.maxcdn.com/libs/respond.js/1.4.2/respond.min.js"></script>
  <![endif]-->

</head>

<body>

  <div id="wrapper">

    <!-- Navigation -->
    <nav class="navbar navbar-inverse navbar-fixed-top" role="navigation">
      <!-- Brand and toggle get grouped for better mobile display -->
      <div class="navbar-header">
        <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-ex1-collapse">
          <span class="sr-only">Toggle navigation</span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
        </button>
        <a class="navbar-brand" href="dashboard.php">Admin Panel</a>
      </div>
      <!-- Top Menu Items -->
      <ul class="nav navbar-right top-nav">
        <li class="dropdown">
          <a href="#" class="dropdown-toggle" data-toggle="dropdown"><i class="fa fa-user"></i>
		  <?php
		  	echo $username;
		  ?>
		  <b class="caret"></b></a>
          <ul class="dropdown-menu">
            <li id="logout-button">
              <a href="#"><i class="fa fa-fw fa-power-off"></i> Log Out</a>
            </li>
          </ul>
        </li>
      </ul>
      <!-- Sidebar Menu Items - These collapse to the responsive navigation menu on small screens -->
      <div class="collapse navbar-collapse navbar-ex1-collapse">
        <ul class="nav navbar-nav side-nav">
          <li>
            <a href="dashboard.php"><i class="fa fa-fw fa-dashboard"></i> Dashboard</a>
          </li>
          <li>
            <a href="manage_cluster.php"><i class="fa fa-fw fa-bar-chart-o"></i> Cluster Management</a>
          </li>
          <li>
            <a href="manage_user.php"><i class="fa fa-fw fa-users"></i> Manage User</a>
          </li>
          <li class="active">
            <a href="speed_test.php"><i class="fa fa-fw fa-car"></i> Speed Test</a>
          </li>
        </ul>
      </div>
      <!-- /.navbar-collapse -->
    </nav>

    <div id="page-wrapper">

      <div class="container-fluid">

        <!-- Page Heading -->
        <div class="row">
          <div class="col-lg-12">
            <h1 class="page-header">
              <i class="fa fa-car"></i> Speed Test
            </h1>
            <ol class="breadcrumb">
              <li>
                <i class="fa fa-dashboard"></i>  <a href="dashboard.php">Dashboard</a>
              </li>
              <li class="active">
                <i class="fa fa-car"></i> Speed Test
              </li>
            </ol>
          </div>
        </div>
        <!-- /.row -->

		  <div id="main-content">

		    <div class="alert" role="alert" id="alert-msg" style="display:none;"></div>	<!-- end of #alert-msg -->

		    <div class="row text-center">
		  	<div class="col-lg-8 col-lg-offset-2">
		        <div class="panel panel-primary">
		          <div class="panel-heading" style="font-size:30px"> Speed Test </div>	<!-- End of .panel-heading -->
              <div class="panel-body" style="font-size:18px">
                <form class="form-horizontal" role="form" id="speed-test-form">
  		            Press <strong>START</strong> to start the speed test

                  <!-- Block size input -->
                  <div class="form-group" style="font-size:14px">
                    <label class="control-label col-sm-6">Block Size (KB):</label>
                    <div class="col-sm-2">
                     <input id="bs-field" type="number" min="1" value="512" stet="1" required autofocus>
                    </div>
                  </div>  <!-- end of .form-group -->

                  <!-- Number of input -->
                  <div class="form-group" style="font-size:14px">
                    <label class="control-label col-sm-6">Number of Blocks:</label>
                    <div class="col-sm-2">
                     <input id="num-bk-field" type="number" min="1" value="200" step="1" required autofocus>
                    </div>
                  </div>  <!-- end of .form-group -->

                  <button type="submit" class="btn-lg btn btn-primary" id="start-speed-test" style="padding-bottom:5px; padding-top:5px;">START</button>
                </form>
		          </div>	<!-- End of .panel-body -->
		        </div>	<!-- End of .panel -->
		  	</div>	<!-- End of .col-md-6 and .col-md-offset-2 -->
		    </div>	<!-- End of .row -->

		  </div>	<!-- End of #main-content -->

		</div>
		<!-- /.container-fluid -->
    </div>
    <!-- /#page-wrapper -->

    </div>
    <!-- /#wrapper -->

    <!-- jQuery Version 1.11.0 -->
    <script src="js/jquery-1.11.0.js"></script>

    <!-- Bootstrap Core JavaScript -->
    <script src="js/bootstrap.min.js"></script>

	<script src="js/common.js"></script>
	<script src="js/speed_test.js"></script>
</body>

</html>
