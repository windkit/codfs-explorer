/**
 * @overview Handle user download file when file name is clicked and provide download file function
 */

 /**
  * Registers event to every field containing '.dl-file-td', the file name field,
  * so that the download starts when user clicks the field
  * @return {void}
  */
function download_main()
{
	// add the click event to all the file listed in the page when it is clicked, the file will be downloaded
	$('.dl-file-td').on('click', function(e){
		// get the name from the hidden field
		send_dl_req(g_curr_rpath, e.currentTarget.parentNode.children[0].value.trim());
	});
}

/**
 * Requests file content from web server by using get method
 * @param {string} path Where the file locates
 * @param {string} file_name File name of the file to be downloaded
 * @return {void}
 */
function send_dl_req(path, file_name)
{
	window.location = "download.php?curr_rpath=" + path + "&req_name=" + file_name;
}
