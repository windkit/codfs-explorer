<?php
  /*
    This is the page where user can do file operation to CodFS
    it supports upload / download / rename / remove file
    it supports create directory, go between directory
  */
  include("config.php");
  $username = @$_COOKIE['user'];
  $session = @$_COOKIE['sess'];

  validate_session($username, $session);

  // desitination path where user want to go
  $des_rpath = @$_GET['dir'];

  /*
   * Check if the fuse program exists
   * cannot use pgrep since pgrep 'CLIENT_FUSE_kenlau_web' cannot find the pattern
   * even the process name appears in ps
   */
  exec('pidof ' . $fuse_proc->exe_name, $pid);
  if(empty($pid))
  {
  	header('HTTP/1.0 503 Service Unavailable');
    include('broken-fuse.html');
	exit();
  }

  // absolute path where the user wants to go in the web server
  // to get path expanding ./ ../ the ending '/' and the duplicated '/' will be removed
  $abs_des_dir = realpath($des_dir . $des_rpath) . '/';

  // check the path user result to access it is valid
  // user may trick web server by typing ../../../tmp, to he can acces /tmp
  // we compare the prefix of the path to make sure it is the path we allowed
  $str_len = strlen($des_dir);
  if(substr($abs_des_dir, 0, $str_len) != substr($des_dir, 0, $str_len))
  {
	redirect_404();
    // http_response_code(404);
    // exit();
  }
  
  $dir_handle = opendir($abs_des_dir);

  // check if the request directory exist
  if($dir_handle === false)
  {
  	redirect_404();
    //http_response_code(404);
    //exit();
  }
?>
<!DOCTYPE html>
<!-- -Using bootstrap v3.2.0 -->
<html lang="en">

<style>
  /*
  reference on body border
  http://css-tricks.com/body-border/
 */

  #top-border, #bottom-border, #left-border, #right-border {
    background: green;
    display: none;
    position: fixed;
    z-index: 999;
  }

  #left-border, #right-border {
    bottom: 0;
    width: 8px;
    top: 0;
  }

  #left-border { left: 0; }

  #right-border { right: 0; }

  #top-border, #bottom-border {
    height: 8px;
    left: 0;
    right: 0;
  }

  #top-border { top: 0; }

  #bottom-border { bottom: 0; }

  .dl-file-td, .dir-td, #prev-dir, .search-file-td {
    cursor: pointer;
    font-size: 15px;
  }

  .jumbotron {
    /*background-color: #009eff !important;*/
    padding-top: 30px !important;
    padding-bottom: 30px !important;
  }

  #upload-file-button+div {
    position: relative !important;
    left: 260px !important;
  }

  .relative-div {
    left:170px;
    position: absolute;
    top: calc(50% - 100px);
  }

  #left-main {
    position: relative;
  }

  .glyphicon-user:before {
    position: relative;
    top: 2px;
  }

  #user-dropdown-div {
    position: relative;
    top: 10px;
  }

  #user-dropdown {
    position: relative;
    left: 245px;
  }

  #user-dropdown-menu {
    left: 260px; !important
  }

  th {
     font-size:16px;
     margin:0;
  }

  .sort-header, #search-header{
    cursor: pointer;
  }

  #file-entry-table th:first-child {
    cursor: default;
  }

  .sort-icon {
    margin-left: 10px;
  }

</style>

<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CodFS Explorer</title>

  <!-- Bootstrap -->
  <link href="css/bootstrap.min.css" rel="stylesheet">
  <!-- Font Awesom -->
  <link href="css/font-awesome.min.css" rel="stylesheet">
  <!-- HTML5 Shim and Respond.js IE8 support of HTML5 elements and media queries -->
  <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
  <!--[if lt IE 9]>
  <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
  <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
  <![endif]-->
  </head>

<body>

  <div id="left-border" class="upload-border"></div>
  <div id="right-border" class="upload-border"></div>
  <div id="top-border" class="upload-border"></div>
  <div id="bottom-border" class="upload-border"></div>
  <!-- Top view part of the page -->
  <div class="jumbotron" id="top-comp">
    <div class="contianer row">
    <div class="col-md-4">
      <div class="row">
        <div class="col-md-5">
          <button type="button" class="btn btn-default btn-lg" id="new-folder-btn" title="New Folder">
            <i class="fa fa-folder"></i> New Folder
          </button>
        </div>  <!-- End of .col-md-5 -->

        <!-- search file -->
        <div class="col-md-5 col-md-offset-2">
          <form role="form" class="form-inline" id="search-file-form">
            <div class="form-group has-feedback">
              <span class="glyphicon glyphicon-search form-control-feedback" style="left: 0px;"></span>
              <input type="text" class="form-control" id="search-file-field" placeholder="search" style="padding-left: 30px;">
              <span class="glyphicon glyphicon-remove form-control-feedback" style="cursor: pointer; display: none" id="cancel-search-icon"></span>
            </div>
          </form> <!-- end of #search-file-form -->
        </div>  <!-- End of .col-md-5 .col-md-offset-2 -->

      </div>  <!-- End of .row-->
    </div>  <!-- End of div embaeed select all and unselect button -->

    <div class="col-md-4">
      <ol class="breadcrumb text-center" style="background-color:transparent;font-size: 30px;margin: 0">
        <li><a href="index.php">Home</a></li>
        <?php
        // to ge the absolute path with ./ and ../ expended
        // realpath() will remove the ending /
        // the directory name we are in without the $des_dir part
        if($abs_des_dir == $des_dir)
            $curr_rpath = $prev_dir_path = '/';
        else
        {
            $curr_rpath = str_replace($des_dir, '', '/' . $abs_des_dir);
            $prev_dir_path = dirname($curr_rpath);
            $des_dir_name = basename($curr_rpath);
            // if the previous directory is '/', we change it back to /
            if($des_dir_name == '.')
              $des_dir = '/';
        }

        // print the name of current directory, if not in home directory
        if($abs_des_dir != $des_dir)
        {
          echo '<li>..</li>';
          echo '<li>';
          echo str_replace(' ', '&nbsp', $des_dir_name) . '</li>';
        }
        else  // case in home directory
        {
            $des_dir_name = '/';
            $prev_dir_path = '/';
        }
        ?>
      </ol>
    </div>  <!-- End of .col-md-4 -->

    <div class="col-md-4 dropdown" id="user-dropdown-div">
      <button class="btn btn-default dropdown-toggle" type="button" id="user-dropdown" data-toggle="dropdown">
      <span class="glyphicon glyphicon-user">
      <?php
        echo $username;
      ?>
      </span>
      <span class="caret"></span>
      </button>
    <ul class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu1" id="user-dropdown-menu">
      <li role="presentation" id="hist-button"><a role="menuitem" tabindex="-1" href="#"><i class="fa fa-history"></i> History</a></li>
      <li role="presentation" class="divider"></li>
      <li role="presentation" id="logout-button"><a role="menuitem" tabindex="-1" href="#"><i class="fa fa-power-off"></i> Logout</a></li>
    </ul>
    </div>  <!-- End of #uer-dropdown-div -->

  </div>  <!-- end of .contianer .row -->
  </div>  <!-- end of #top-comp -->
  <!-- end of top view par-->

  <!-- Middle part of the page -->
  <div class="row" id="main-content" style="margin:0;">

  <div class="col-md-3" id="left-main">
    <div class="alert alert-danger" id="recover-msg" style="display:none;"></div>
    <div class="alert alert-info" id="speed-msg" style="display:none;"></div>
    <div class="alert alert-danger" id="alert-msg" style="display:none;"></div>

    <div class="text-center" style="position:absolute; top: 35%">
      <i class="fa fa-file-image-o fa-5x"></i> <br>
      <div>
        <p style="position:fix;font-size:30px;max-width:250px">Drag to page to upload files</p>
      </div>
    </div>  <!-- end of .relative-div -->
  </div>  <!-- end of #left-main -->

  <div class="col-md-9" id="right-main">
  <?php
  /*
    To display all the entry in this directory $abs_des_dir
  */

  echo "<form id='rm-file-form'><table class=\"table table-striped table-hover\" id=\"file-entry-table\">";
  // the heading of the table
  echo "<thead><th><input type=\"checkbox\" id=\"checkbox-all\"></th>";
  echo "<th class='sort-header' id='sort-name'>File Name</th>";
  echo "<th class='sort-header' id='sort-size'>File Size (MB)</th>";
  echo "<th class='sort-header' id='sort-lm'>Last Modified Time</th></thead><tbody>";

  // allow to show previous directory sign
  // go back to previous directory if user is not in HOME directory
  if($abs_des_dir != $des_dir)
    echo "<tr><td></td>" . '<td id="prev-dir"><i class="fa fa-reply"></i><strong> &nbsp;&nbsp;..</strong></td>' . "<td></td>" . "<td></td></tr>";

  while(($file_entry = readdir($dir_handle)) != false)
  {
    // hide all hidden file
    if($file_entry[0] == ".")
      continue;

    $f_info = stat($abs_des_dir . $file_entry);

    // it is a directory
    if($f_info['mode'] & 0040000)
    {
      echo "<tr class=\"dir-entry-row\">";
      echo "<input type='hidden' class='file-name-hidden' value=\"$file_entry\">";
      echo '<td><input class="rm-checkbox" type="checkbox" name="rm_file[]"  value="' . $file_entry . '" title="' . $file_entry . '"></td>';
      echo "<td class=\"dir-td\" title=\"go to $file_entry\">";
      echo '<i class="fa fa-folder"></i> &nbsp;&nbsp;' .  str_replace(' ', '&nbsp;', $file_entry) . '</td>';
    }
    else  // it is a file
    {
      echo "<tr class=\"file-entry-row\">";
      echo "<input type='hidden' class='file-name-hidden' value=\"$file_entry\">";
      echo '<td><input class="rm-checkbox" type="checkbox" name="rm_file[]"  value="' . $file_entry . '" title="' . $file_entry . '"></td>';
      echo "<td class=\"dl-file-td\" title=\"click to download file\">";
      echo '<i class="fa fa-file"></i> &nbsp;&nbsp;' . str_replace(' ', '&nbsp;', $file_entry) . '</td>';
    }

    echo '<td class="f_size" value="' . $f_info["size"] . '">' . round( ($f_info["size"] / (1024 * 1024)) , 2). '</td>';
    echo '<td class="f_lm_time" value="' . $f_info['mtime'] .'">' . date('j-n-Y H:i:s', $f_info['mtime']). '</td>';
    echo '</tr>';
  }
  echo "</tbody></table>";
  echo "</form>";
  ?>

  <!-- Table to display the search result -->
  <table class="table table-striped table-hover" id="search-result-table" style="display:none">
    <thead>
	  <th></th>
      <th id="search-header">File Name</th>
      <th>Path</th>
    </thead>
    <tbody></tbody>
  </table> <!-- end of #search-result-table -->
  </div>
  </div>
  <!-- End of middle part of the page -->

  <!-- Progress bar, width is the progress -->
  <div class="progress" id="prog-bar" style="margin-bottom:0;">
    <div class="progress-bar progress-bar-striped active" id="progress-content" role="progressbar" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100" style="width: 0%">
      <span class="sr-only">0% Complete</span>
   </div>
  </div>
  <!-- end of progress bar -->

  <!-- bottom part of the page-->
  <div class="jumbotron row" id="bottom-comp" style="margin-right:0;margin-bottom:0;">
    <div class="col-md-4">
    <!--
        <button type="button" class="btn btn-default btn-lg" id="dl-button" title="Download file" disabled="disabled">
          <span class="glyphicon glyphicon-download-alt"></span> Download
        </button>
    -->
        <button type="button" class="btn btn-default btn-lg fn-button" id="rm-button" title="Delete file" disabled="disabled">
          <span class="glyphicon glyphicon-trash"></span> Remove
        </button>
        <button type="button" class="btn btn-default btn-lg fn-button" id="rename-button" style="position: relative; left:30px;" title="Delete file" disabled="disabled">
          <span class="glyphicon glyphicon-edit"></span> Rename
        </button>
      </div>

    <div class="col-md-4 col-md-offset-4">
      <form id="upload-file-form">
        <input id="upload-file-button" type="file" class="filestyle" data-iconName="glyphicon-upload" data-buttonBefore="true" data-input="false" data-size="lg" multiple>
      </form>
    </div>  <!-- end of .col-md-4 .col-md-offset-4-->
    <!-- End of the bottom part of the page-->

    <!-- screen pop up to display history-->
    <div class="modal fade" id="hist-popup" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
            <h4 class="modal-title" id="hist-popup-title">User history</h4>
          </div>
          <div class="modal-body" id="hist-popup-body">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>  <!-- End of .modal -->
  </div>  <!-- end of #bottom-comp -->
</body>
  <!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
  <script src="js/jquery-1.11.0.js"></script>
  <!-- Include all compiled plugins (below), or include individual files as needed -->
  <script src="js/bootstrap.min.js"></script>
  <script src="js/bootstrap-filestyle.min.js"></script>
  <script src="js/main.js"></script>
  <script src="js/upload.js"></script>
  <script src="js/download.js"></script>
  <script src="js/folder.js"></script>
  <script src="js/remove.js"></script>
  <script src="js/rename.js"></script>
  <script src="js/common.js"></script>
  <script src="js/user_log.js"></script>
  <script src="js/server_health.js"></script>
  <script src="js/search_files.js"></script>
  <script>
  // store the current path in the session storage
  <?php
  	echo 'var g_curr_rpath = '.  "'" . $curr_rpath . "';";
	echo 'var g_prev_rpath = '.  "'" . $prev_dir_path . "';";
  ?>
  </script>
</html>
