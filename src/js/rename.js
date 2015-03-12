/**
 * File handle rename events and rename related
 * @requires jQuery
 */

/**
 * Prompts user to request for the new file name, then calls call_mv_ajax() to ask web server to rename the file/directory 
 * <br>Loaded by main.js
 * @return {void}
 */
function rename_main()
{
	/* 
	 * for every file want to rename, prompt a window box for asking new name
	 * then send back result to server to do the rename
	 */
	$("#rename-button").on("click", function(){
		// get all the selected file name
		var $file_entry = $(".rm-checkbox:checked").parents("tr").children(".file-name-hidden");

		for(var i = 0, arr_len = $file_entry.length; i < arr_len; i++)
		{
			var file_name = $file_entry[i].value;
			var new_name = window.prompt("New file name for " + file_name, file_name);
			while(file_name == new_name)
			{
				new_name = window.prompt("Error: The new file name is same as old file name\n" + 
								"New file name for " + file_name, file_name);
			}
			
			// user press cancel
			if(new_name == null)
				continue;

			call_mv_ajax($($file_entry[i].parentNode), file_name, new_name);
		}	// end of for-loop
	});
}	// end of rename_main()

/**
 * Renames file / directory via ajax
 * @param {jQuery} $file_tr_dom jQuery Object of the &lt;tr&gt; tag which to be change
 * @param {string} old_name Old name of the file/directory
 * @param {string} new_name New name of the file/directory
 * @return {void}
 */
function call_mv_ajax($file_tr_dom, old_name, new_name)
{
	$.ajax({
		type: 'POST',
		url: 'rename.php',
		dataType: 'json',
		data: {old_name: old_name, new_name: new_name, curr_rpath: g_curr_rpath}
	}).done(function(reply){
		switch(reply['ret_no'])
		{
			case 0:	// change the file name on the page
				console.log("name: " + old_name + " " + new_name);
				display_new_name(new_name, $file_tr_dom);
				break;
			/* Error handle */
			case 1:
			case 2:
			case -1:
				/*
				 * Display Error messge to notify user
				 */
				// store back previous message, if any
				var msg = '';
				var prev_msg = document.getElementById('alert-msg').innerHTML;
				// first time to encounter problem, we have to craft the msg
				if(prev_msg == '')
					msg = 'Error:<br><ol>' + '<li>' + reply['msg']  + '</li></ol>';
				else
					msg += prev_msg.replace('</ol>', '') + '<li>' + reply['msg']  + '</li></ol>';

				display_alert_msg('alert-msg', 'alert-danger', msg);
				setTimeout(function(){
					$('#alert-msg').fadeOut();
				}, 10000);
				break;
		}	// end of switch
	}).always(function(){
		document.getElementById('checkbox-all').checked = false;
	});
}	// end of call_mv_ajax()

/**
 * Changes the file/directory to a new name, and unchecks the checkbox
 * @param {string} new_name File/directory new name
 * @param {jQuery} entry jQuery &lt;tr&gt; tag object to be renamed
 * @return {void}
 */
function display_new_name(new_name, entry)
{
	entry.fadeOut(function(){
		var children = $(this).children();
		/*
		 *	The following children[] are pure JS
		 */
		// input hidden field
		children[0].value = new_name;
		// the td checkbox
		children[1].children[0].title = new_name;
		children[1].children[0].value = new_name;
		// uncheck the checkbox
		children[1].children[0].checked = false;
		// the td file name
		children[2].innerHTML = '<i class="fa fa-file"></i>' + " &nbsp;&nbsp;" + web_filename(new_name);

		// sort back the file, from main.js
		sort_file();
		$(this).fadeIn();
	});
}	// end of display_new_name()
