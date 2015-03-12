<?php
	include('config.php');
	$username = @$_COOKIE['user'];
	$session = @$_COOKIE['sess'];

	validate_session($username, $session);
?>
<!DOCTYPE html>
<!-- This is the dashboard page -->
<!-- using sb admin (ref: http://startbootstrap.com/template-overviews/sb-admin/)-->
<html lang="en">

<head>
  <style>
  	#loading {
		font-size: 35px;
	}

	.chart-body {
		min-height: 300px;
	}
  </style>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="">
  <meta name="author" content="">

  <title>CodFS Explorer Admin Panel</title>

  <!-- Bootstrap Core CSS -->
  <link href="css/bootstrap.min.css" rel="stylesheet">

  <!-- Custom CSS -->
  <link href="css/sb-admin.css" rel="stylesheet">

  <!-- Custom Fonts -->
  <link href="css/font-awesome.min.css" rel="stylesheet" type="text/css">

  <!-- sb-admin to plot graph-->
  <link href="css/plugins/morris.css" rel="stylesheet" type="text/css">

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
          <li class="active">
            <a href="dashboard.php"><i class="fa fa-fw fa-dashboard"></i> Dashboard</a>
          </li>
          <li>
            <a href="manage_cluster.php"><i class="fa fa-fw fa-bar-chart-o"></i> Cluster Management</a>
          </li>
          <li>
            <a href="manage_user.php"><i class="fa fa-fw fa-users"></i> Manage User</a>
          </li>
          <li>
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
              <i class="fa fa-dashboard"></i> Dashboard <small>System Overview</small>
            </h1>
            <ol class="breadcrumb">
              <li class="active">
                <i class="fa fa-dashboard"></i>  <a href="dashboard.php">Dashboard</a>
              </li>
            </ol>
          </div>
        </div>
        <!-- /.row -->

	    <div id="main-content" style="display:none">

	      <!-- To display any warning/error msg -->
	      <div class="row">
		  	<div class="col-lg-12">
		      <div class="alert" role="alert" id="alert-msg" style="display:none;">
	        </div>	<!-- end of #alert-msg -->
			</div>	<!-- End of .col-lg-12 -->
		  </div>	<!-- End of .row-->

		  <h2>Overview</h2>
		  <div id="overview">
		  <!-- Display Monitor Status -->
	      <div class="row">
		  	
			<div class="col-lg-6" id="monitor-content">
			  <div class="panel panel-success">
			    <div class="panel-heading">
				  <!-- using inline style because it does not response to the style tage-->
				  <i class="fa fa-desktop fa-3x"></i><span style="font-size: 30px;"> &nbsp;Monitor</span>
				</div> <!-- End of .panel-heading -->
				  <table class="table table-striped table-hover" id="monitor-table">
				    <thead>
					 <tr>
					  <th>#</th>
					  <th>id</th>
					  <th>IP</th>
					  <th>Port</th>
					 </tr>
				    </thead>
					<tbody></tbody>
				  </table>
			  </div> <!-- End of .panel-->
			 
			
			</div>	<!-- End of .col-lg-6 -->
		    <!-- Display MDS status -->
		    <div class="col-lg-6" id="mds-content">

			   <div class="panel panel-success">
			    <div class="panel-heading">
				  <i class="fa fa-sitemap fa-3x"></i><span style="font-size: 30px;"> &nbsp;MDS</span>
				</div>	<!-- End of panel-heading -->
				  <table class="table table-striped table-hover" id="mds-table">
				    <thead>
					 <tr>
					  <th>#</th>
					  <th>id</th>
					  <th>IP</th>
					  <th>Port</th>
					 </tr>
				    </thead>
					<tbody></tbody>
				  </table>
			   </div>	<!-- End of panel-->
		      
		    </div>	<!-- End of .col-lg-6 -->

		  </div>	<!-- End of .row-->

		    <!-- Display OSD Status-->
	        <div class="row">
		      <div class="col-lg-12" id="osd-content">
			    <div class="panel panel-primary">
			      <div class="panel-heading">
				    <i class="fa fa-database fa-3x"></i><span style="font-size: 30px;"> &nbsp;OSD</span>
				  </div>	<!-- End of panel-heading -->
				  <table class="table table-striped table-hover" id="osd-table">
				    <thead>
					 <tr>
					  <th>#</th>
					  <th>id</th>
					  <th>IP</th>
					  <th>Port</th>
					  <th>Capacity (GB)</th>
					  <th>Free (GB)</th>
					 </tr>
				    </thead>
					<tbody></tbody>
				  </table>
			     </div>	<!-- End of panel-->
		      </div>	<!-- End of .col-lg-6 -->
		  </div>	<!-- End of .row-->
		  </div>	<!-- End of #overview-->

		  <div id="storage">
		    <h2>Storage</h2>

			<!-- Overview of storage -->
			<div class="row">
			  <div class="col-lg-6 col-lg-offset-3">
			    <div class="panel panel-info" id="overall-storage-panel">
			      <div class="panel-heading" style="font-size: 22px">Storage Overview</div>
			      <div class="panel-body">
			        <div class="chart-body" id="overall-storage"></div>
			      </div>
			    </div> <!-- end of .panel -->
			  </div>	<!-- End of .col-lg -->
			</div>	<!-- End of row -->
		  </div>	<!-- End of #storage -->

		  <!-- Each storage node statis -->
		  <h2>Individual OSD</h2>
		  <div id="osd-info" class="row">
		  </div>	<!-- End of #osd-info -->


	    </div>	<!-- End of #main-content -->

		<!-- Loading graph -->
		<div id="loading" class="text-center">
			<i class="fa fa-spinner fa-spin fa-5x"></i>
		</div>	<!-- End of #loading -->
      </div>
      <!-- ./container-fluid -->
	</div>
    <!-- /#page-wrapper -->

  </div>
  <!-- /#wrapper -->

  <!-- jQuery Version 1.11.0 -->
  <script src="js/jquery-1.11.0.js"></script>

  <!-- Bootstrap Core JavaScript -->
  <script src="js/bootstrap.min.js"></script>

  <!-- plugin in sb-admin to draw graph -->
  <script src="js/plugins/morris/morris.min.js"></script>
  <script src="js/plugins/morris/raphael.min.js"></script>

  <script src="js/common.js"></script>
  <script src="js/dashboard.js"></script>
</body>

</html>
