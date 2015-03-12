<?php
	include('config.php');
	$username = @$_COOKIE['user'];
	$session = @$_COOKIE['sess'];

	validate_session($username, $session);
?>
<!DOCTYPE html>
<!-- using sb admin (ref: http://startbootstrap.com/template-overviews/sb-admin/)-->
<!-- Page of doing user management -->
<html lang="en">

<head>
  <style>
  	#user-table {
		font-size: 16px;
	}

	/* control td / th width of checkbox*/
	#user-table td:nth-of-type(1), #user-table th:nth-of-type(1) {
		width: 50px;
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
          <li class="active">
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
			  <i class="fa fa-fw fa-users"></i> Manage User
            </h1>
            <ol class="breadcrumb">
              <li>
                <i class="fa fa-dashboard"></i>  <a href="dashboard.php">Dashboard</a>
              </li>
              <li class="active">
                <i class="fa fa-fw fa-users"></i> Manage User
              </li>
            </ol>
          </div>
        </div>
        <!-- /.row -->
		<div id="main-content">
          <div class="alert" style="display:none;" id="ret-msg" role="alert">
          </div>
          <div class="row">
            <div  class="col-md-8 col-md-offset-2">
            <table class="table table-striped table-hover" id="user-table">
            <thead><tr>
              <th><input type="checkbox" id="select-all-chkbox" title="Select all / Select none"></th>
          	<th style="font-size:20px">
          		User
          		<button type="button" class="btn btn-primary" id="remove-btn" style="float: right;" title="Click to remove user" disabled="disabled">
          			Remove User
          		</button>
          	</th>
            </tr></thead>
            <tbody>

		<?php
				$curr_user = $username;

				// iterate to get all the users in db
				$db_handle = db_login();
				$stmt = $db_handle->prepare('SELECT name FROM users');
				$stmt->execute();

				while(($ret = $stmt->fetch(PDO::FETCH_ASSOC)))
				{
					// the checkbox field
					echo "<tr><td><input type=\"checkbox\"></td>";
					// the user name
					echo "<td title=\"${ret['name']}\"><i class=\"fa fa-user\"></i> &nbsp;<span class=\"name-field\">${ret['name']}</span></td></tr>";
				}
		?>
<tr>
  <td></td>
  <td>
    <form class="form-inline row" role="form" id="add-user-form">
	 <div class="col-md-4">
	   <input type="text" class="form-control" name="name" placeholder="user name" required>
	 </div>
	 <div class="col-md-4">
	   <input type="password" class="form-control" name="passwd" placeholder="password" required>
	 </div>
	 <div class="col-md-4 form-group">
	   <div class="input-group">
	     <input type="password" class="form-control" name="conf-passwd" placeholder="confirm password" required>
	  	 <span class="input-group-btn" id="add-user-btn">
	  	   <button class="btn btn-default" type="submit" title="Add user">+</button>
      	 </span>
	   </div>	<!-- End of .input-ground-->
	</div>	<!-- End of .form-group -->
	</form>
  </td>
</tbody></table>
</div>	<!-- end of .col-md contain the table -->	</div>	<!-- end of .row contains #user-table -->
	  </div>	<!-- Enf of #main-content-->
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
	<script src="js/manage_user.js"></script>
	<script src="js/common.js"></script>
</body>

</html>
