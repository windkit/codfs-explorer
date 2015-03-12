<?php
	include('config.php');
	$username = @$_COOKIE['user'];
	$session = @$_COOKIE['sess'];

	validate_session($username, $session);
?>
<!DOCTYPE html>
<!-- using sb admin (ref: http://startbootstrap.com/template-overviews/sb-admin/)-->
<html lang="en">

<head>
  <style>
    .rm-logo, .rm-sel-logo{
		font-size: 16px;
		cursor: pointer;
	}

  	#loading {
		font-size: 35px;
	}

	.ip-input {
		padding: 10px;
		padding-right: 50px; !important
		padding-left: 50px; !important
	}

	#add-osd-ip, #add-osd-id {
		width: 100%; !important  /* .form-inline set to auto, which will not use all the area */
	}
  </style>

  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="">
  <meta name="author" content="">

  <title>CodFS Explorer Admin Panel - Cluster Management</title>

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
          <li class="active">
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
              Cluster Management <small>Manage Nodes</small>
            </h1>
            <ol class="breadcrumb">
              <li>
                <i class="fa fa-dashboard"></i>  <a href="dashboard.php">Dashboard</a>
              </li>
              <li class="active">
                <i class="fa fa-bar-chart-o"></i> Cluster Management
              </li>
            </ol>
          </div>
        </div>
        <!-- /.row -->
		 <div id="main-content" style="display:none">
		   <!-- Message on sucess or failed -->
		   <div id="alert-msg" role="alert" class="alert" style="display:none">
		   </div>	<!-- End of #alert-msg -->

		   <div id="monitor-pannel">
		       <div class="panel panel-info">
			   <div class="panel-heading">Monitor Status</div>
			   <table class="table table-striped table-hover" id="monitor-table">
			     <thead> <tr>
					<th>ID</th>
					<th>IP</th>
					<th>Port</th>
				  </tr></thead>
				 <tbody>
				 </tbody>
			   </table>	<!-- end of #monitor-table -->

			 </div>
		   </div> <!-- end of #monitor-pannel -->

		   <div id="mds-pannel">
		     <div class="panel panel-success">
			   <div class="panel-heading">MDS Status</div>
			   <table class="table table-striped table-hover" id="mds-table">
			     <thead> <tr>
					<th>ID</th>
					<th>IP</th>
					<th>Port</th>
				  </tr></thead>
				 <tbody></tbody>
			   </table>	<!-- end of #monitor-table -->

			 </div>	<!-- End of .pannel-->
		   </div> <!-- End of #mds-panel -->

		   <div id="osd-panel">
		     <div class="panel panel-primary">
			   <div class="panel-heading">OSD Status</div>
			   <table class="table table-striped table-hover" id="osd-table">
			     <thead> <tr>
				    <th><input type="checkbox" id="rm-all" title="Select all or remove all"></th>	<!-- checkbox field-->
					<th><i class="fa fa-times-circle rm-sel-logo" id="rm-chk-logo" style="display:none; color:red" title="Remove selected records"></i></th>	<!-- remove pic field-->
					<th>ID</th>
					<th>IP</th>
					<th>Port</th>
					<th>Capacity (GB)</th>
					<th>Free (GB)</th>
				  </tr></thead>
				 <tbody>
				 </tbody>
			   </table>	<!-- end of #osd-table -->

				<form class="row form-inline" role="form" id="osd-form">
				  <div class="col-md-8">
				    <div class="ip-input"><input type="text" class="form-control" placeholder="Enter IP Address" id="add-osd-ip" required></div>
				  </div>	<!-- end of .col-md-8 -->

				  <div class="form-group col-md-4">
				    <div class="ip-input">
				    <div class="input-group">
					  <input type="number" min="1" class="form-control" placeholder="Enter Component ID" id="add-osd-id" required>
				      <span class="input-group-btn add-node-btn" id="add-osd" title="Click to add OSD">
				  	    <button class="btn btn-default" type="submit">+</button>
				      </span>
				    </div>	<!-- end of .input-group -->
				  </div>	<!-- .end of .ip-input -->
			      </div>	<!-- end of .form-group -->
				<form>  <!-- end of .row -->

			 </div>	<!-- end of .pannel -->
		   </div>	<!-- end of #osd-panel -->
		   </div>	<!-- end of #main-content -->

		  <!-- Loading graph -->
		  <div id="loading" class="text-center">
		  	<i class="fa fa-spinner fa-spin fa-5x"></i>
		  </div>	<!-- End of #loading -->
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
	<script src="js/manage_cluster.js"></script>
</body>

</html>
