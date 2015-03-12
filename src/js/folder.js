/**
 * @overview When user clicks to a direcotry which request new directory
 * @requires jQuery
 * @requires main.js
 * @requires common.js
 */

/**
 * Registers click event for directory name and previous directory field. When the
 * directory field is clicked, the browser will go to the page containing the directory content
 * <br> Loaded by main.js
 * @return {void}
 */
function folder_main()
{
	// to enter other directory
	$('.dir-td').on('click', opendir);

	// go to previous dir when is it clicked
	var prev_dir = document.querySelector('#prev-dir');
	// home directory has no previous directory
	if(prev_dir != null)
	{
		prev_dir.addEventListener('click', function(e){
			// the destination path is not include currect directory
			window.location = '?dir=' + g_prev_rpath;
		})
	}
}

/**
 * Enters the directory page specified by the triggered event
 * @param {event} e event which contains directory name
 * @return {void}
 */
function opendir(e)
{
	// get the directory name to be enter from the hidden field
	var folder_name = e.currentTarget.parentNode.childNodes[0].value;
	
	// if in home directory, we skip the '/' since the next statement will add the '/'
	if(g_curr_rpath == '/')
		g_curr_rpath = '';
	// request new page base on the dir clicked and the current path
	window.location = '?dir=' + g_curr_rpath + folder_name;
}

/**
 * Requests web server to create a new directory at the current directory via ajax
 * @return {void}
 */
function create_folder()
{
	var dir_name = window.prompt("Please enter a new folder name\n" + '(Cannot contain character: \\ / : ? & < > " \' |)');

	// not allow empty string
	if(dir_name == "")
		return ;

	// when user press cancel
	if(dir_name == null)
		return ;
	// directory cannot contain any of the character \ / : ?& < > " ' |
	if(dir_name.search(/[\\\/:?&<>"'|]/g) > -1)
	{
		window.alert('The directory name cannot consist any of the following character: \\ / : ? & < > " \' |');
		return ;
	}

	$.ajax({
		url: 'mkdir.php',
		type: 'POST',
		dataType: 'json',
		data: {dir_name: dir_name, curr_rpath: g_curr_rpath}
	}).done(function(reply, textStatus, jqXHR){
		switch(reply['ret'])
		{
			case 0:	//success
				fix_folder_entry(dir_name, reply['size'], reply['lm_time'], reply['unix_time']);
				break;
			case 1:
				display_alert_msg('alert-msg', 'alert-danger', reply['msg']);
				setTimeout(function(){
					$('#alert-msg').fadeOut();
				}, 6000);
				break;
			default:
				display_alert_msg('alert-msg', 'alert-danger', 'Cannot create directory "' + dir_name + '"');
				// hide back the alert message sometime later
				setTimeout(function(){
					$('#alert-msg').fadeOut();
				}, 6000);
		}

	}).fail(function(jqXHR, textStatus, errorThrown){
	});
}

/**
 * Adds the directory entries into the web page and attach event listeners on them
 * @param {string} dir_name Name of the directory
 * @param {number} size File size of the directory
 * @param {string} lm_time Last modified time
 * @param {number} unix_time Last modified time in unix timestamp
 * @return {void}
 */
function fix_folder_entry(dir_name, size, lm_time, unix_time)
{
	var $tbody = $('#file-entry-table tbody');
	var dom = document.createElement('tr');
	dom.className = 'dir-entry-row';
	dom.style.display = "none";

	dom.innerHTML = '<input type="hidden" class="file-name-hidden" value="' + dir_name + '">' +
			  '<td><input class="rm-checkbox" type="checkbox" name="rm_file[]"  value="' + dir_name + '" title="' + dir_name + '"></td>' +
			  '<td class="dir-td" title="go to ' + dir_name + '"><i class="fa fa-folder"></i> &nbsp;&nbsp;' + web_filename(dir_name) + '</td>' +
			  '<td class="f_size" value="' + size + '">' + conv_size(size) + '</td>' +
			  '<td class="f_lm_time" value="' + unix_time + '">' + lm_time + '</td>';

	// attach the event when user click to enter the directory
	dom.childNodes[2].addEventListener('click', opendir);

	/** 
	 * Decide where to add the entry
	 * @requires common.js
	*/
	add_to_table(dom);
	// attach event listener to its checkbox
	/** @requires main.js */
	add_checkbox_event($(dom).find('.rm-checkbox'));
	$(dom).fadeIn();
}
