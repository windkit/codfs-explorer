/**
 * @overview
 * This file handle the file chunking and file upload to web server
 * <br>It also handles the display of uploaded entry in the browser and add back the event listener
 * @requries jQuery
 */
var MAX_UPLOAD = 128;	// max no, of file can hold in the upload queue
var fade_duration = 500;	// duration of the web page border to fade in and fade out
var CHUNK_SIZE = 4194304;	// 4 MB
var g_file_queue = [];	// a queue stores list of file to be uploaded, each entry is list of file to be uploaded
var g_num_files = 0;	// total number of files in the queue
var g_curr_file_index;	// the index of file list in the g_file_queue
var reader = new FileReader();
var speed_msg_timeout;	// to store the return of setTimeout on #speed-msg, when the time reached, the write speed message will disappear
var total_upload_size = 0;	// in MB
var total_upload_time = 0;	// in second


/**
 * Initializes event listener for file upload. Loaded by main.js during start up
 * @return {void}
 */
function upload_main()
{
	var html_tag = document.querySelector("html");


	/*
	 * browser border
	 */
	// when user drag the file to browser, the browser border change to green
	$('html').on('dragenter', function(e){
		e.preventDefault();
		e.stopPropagation();
		// Change the color and display the web page bordedr
		$(".upload-border").fadeIn(fade_duration);
	});
	// when user leave the browser, then borwser border display normal
	$('html').on('mouseout', function(e){
		e.preventDefault();
		e.stopPropagation();
		// Change the color and display the web page bordedr
		$(".upload-border").fadeOut(fade_duration);
	});

	/*
	 * Upload file using drag-drop
	 * the drop event needs to work with dragover
	 * to prevent the default read the file in browser
	 */
	html_tag.addEventListener("dragover", function(e){
		e.stopPropagation();
		e.preventDefault();
	} , false);
	// upload file when user drops the file in the browser area
	html_tag.addEventListener("drop", drop_file);

	/*
	 *	Using upload button to upload file
	 */
	$("#upload-file-button").on("change", function(e){
		var files = document.getElementById("upload-file-button").files;
		// the number of file to be uploaded, if user press cancel,
		// the length will be 0, so we should not call any upload method
		if(files.length > 0)
		{
			// upload the file
			upload_files(files);
		}
		else
		{
			// remove the badge which is 0, as it is default set by file input form
			var $badge =  $('#upload-file-form .badge');
			if($badge.length > 0)
				$badge.remove();
		}
	});

}

/**
 * Handles the event that when user drops a file on the page, the file is uploaded to web server
 * @param {event} e Event
 * @return {void}
*/
function drop_file(e)
{
	e.stopPropagation();
	e.preventDefault();
	// Change the color and display the web page bordedr
	$(".upload-border").fadeOut(fade_duration);

	upload_files(e.dataTransfer.files);
}

/**
 * updates progress bar during file upload. The progress is calculated as number of
 * finished chunk / total number of chunk
 * @param {number} finished_chunk Number of chunks uploaded
 * @param {number} total_chunk Total number of chunks needs to be uploaded
 * @return {void}
 */
function update_progress(finished_chunk, total_chunk)
{

	var prec = (finished_chunk / total_chunk) * 100;

	$("#progress-content").css("width", prec + "%");
	$("#progress-content span").html(prec + "%");

	// reset it back to 0
	if(prec >= 100)
	{
		$("#progress-content").css("width", "0%");
		$("#progress-content span").html("0%");
	}
}

/**
 * driver function to trigger file upload by calling slice_file()
 * @param {File[]} file_list List of files to be uploaded, obtained from the drop file event
 * @return {void}
 */
function upload_files(file_list)
{
	var num_to_upload = 0, len;
	// push the upload request to the end of the queue
	for(num_to_upload = 0, len = file_list.length; num_to_upload < len; num_to_upload++)
	{
		if(g_num_files <  MAX_UPLOAD)
		{
			g_file_queue.push(file_list[num_to_upload]);
			g_num_files++;
		}
		else // limit reached, display error message and do not add to queue
		{
			display_alert_msg('alert-msg', 'alert-danger', "The upload queue had fulled<br>The limit is " + MAX_UPLOAD);
			setTimeout(function(){
				$('#alert-msg').fadeOut();
			}, 6000);
			break;
		}
	}

	update_upload_badge();

	// to check if there is some file is uploading, for following if statement is true
	// if there is no upload process triggers, check if > 0 because if there is problem the following will proceed
	if(g_num_files == num_to_upload && g_num_files > 0)
		slice_file(g_file_queue.shift(), 0);
}
/**
 * Triggers the upload of next file. Stops file upload if there is no file left
 * @return {void}
 */
function upload_next_file()
{
	if(g_num_files > 0)
	{
		// to stop the #speed-msg from fading in the middle of upload
		clearTimeout(speed_msg_timeout);
		console.log('start another file upload');
		slice_file(g_file_queue.shift(), 0);
	}
}

/**
 * Reads a specific part of content in the file based on the id
 * @param {File} file Interface to provide access of file information and content
 * @param {number} id Chunk id indicating the part of file to be read
 * @return {void}
 */
function slice_file(file, id)
{
	var file_name = file.name;
	var file_size = file.size;
	var total_chunk = Math.ceil(file_size / CHUNK_SIZE);
	var start = id * CHUNK_SIZE;
	var end = start + CHUNK_SIZE;
	var end =  end >  file_size ? file_size : end; // bound check
	// var reader = new FileReader();	// not create it here, since will cause huge mem usage, we can create it once instead of keep creating it

	// fix if file size if 0 by forcing the total number of chunk to be 1
	total_chunk = total_chunk == 0 ? 1 : total_chunk;
	// Displaty some progress to let user knows the file is uploading as start up of each file
	if(id == 0)
	{
		update_write_speed('-------');
		/*
			give small progress as a feed back to user that the file is uploading
			if the default value is more than 100, and we do not use if, the progress bar will
			go back after this chunk is uploaded
		*/
		if(total_chunk > 100)
			update_progress(1, total_chunk);
		else
			update_progress(1, 100);
	}
	reader.onloadend = function(e){
		if(e.target.readyState == FileReader.DONE)
			upload_chunk(blob, id, file_name, file_size, end - start, total_chunk, file);
	};

	/** @function */
	var blob = file.slice(start, end);
	reader.readAsBinaryString(blob);
}
/**
* Uploads data chunk to web server via ajax
* @param {Blob} data Data chunk to be uploaded
* @param {number} id chunk id which indicates the position of data chunk
* @param {string} name file name
* @param {number} file_size file size
* @param {number} chunk_size the size of data chunk
* @param {number} total_chunk total number of data chunk
* @param {File} file_data Interface to provide access of file information and content
* @return {void}
*/
function upload_chunk(data, id, name, file_size, chunk_size, total_chunk, file_data)
{
	var path = g_curr_rpath;
	var des = encodeURI('upload.php?curr_rpath=' + path + '&name=' + name + '&total_chunk=' + total_chunk +
						'&chunk_id=' + id + '&total_size=' + file_size + '&chunk_size=' + chunk_size);

	var xhr = new XMLHttpRequest();
	xhr.open("POST", des, true);
	xhr.onreadystatechange = function(){
		if(xhr.readyState == 4)
		{
			var new_entry = true;
			/*
			 * We don't need the data anyway, to free it by setting to null, it can
			 * reduce the memory consumption of browser
			*/
			data = null;

			if(xhr.status == 200)
			{
				var reply = JSON.parse(xhr.responseText);

				if(reply["result"] == 0)
				{
					// calculate the write speed of OSD
					total_upload_size += chunk_size / 1024 / 1024;
					total_upload_time += reply['up_time'];
					update_write_speed((total_upload_size / total_upload_time).toFixed(2));
console.log('id: '  + id + " | total: " + total_chunk);
					// update progress bar
					id++;
					update_progress(id, total_chunk);
					// if this is the last chunk, then we are finished uploading a file
					if(id >= total_chunk)
					{
						// reset the counter in upload time and upload size
						total_upload_size = 0;
						total_upload_time = 0;

						console.log("finish upload file: " + name);
						// hide the upload speed result
						speed_msg_timeout = setTimeout(function(){
							$("#speed-msg").fadeOut();
						}, 5000);

						g_num_files--;
						update_upload_badge();
						upload_next_file();
						fix_file_entry(name, file_size, reply['lm_time'], reply['unix_time']);
					}
					else
					{
						// upload next chunk
						slice_file(file_data, id);
					}
				}
				else
				{
					/*
					 * Failed to upload a data chunk
					 * We give up this chunk and start a new file upload
					 */

					console.log("Failed to upload the file: " + name + " chunk id: " + id);
					serTimeout(function(){
						display_alert_msg('alert-msg', 'alert-danger', "Failed to upload file: " + name);
					}, 10000);
					// reset the counter in upload time and upload size
					total_upload_size = 0;
					total_upload_time = 0;
					// reset the progress to 0 as init
					update_progress(0, 1);

					// A
					// prepare to upload next file if any
					g_num_files--;
					update_upload_badge();
					upload_next_file();

					// hide the upload speed result
					speed_msg_timeout = setTimeout(function(){
						$("#speed-msg").fadeOut();
					}, 5000);
				}
			}
			else	// abord the upload for this file, try to send the next file
			{
				console.log("Failed to upload the file: " + name + " chunk id: " + id);
				serTimeout(function(){
					display_alert_msg('alert-msg', 'alert-danger', "Failed to upload file: " + name);
				}, 10000);
				update_progress(0, 1); // reset the progress to 0 as init
				upload_next_file();
			}
		}
	};

	xhr.send(data);
}

/**
 * Updates the entry in the table
 * @param {string} name file name of the entry
 * @param {number} filesize file size of the entry
 * @param {string} lm_time last modified time
 * @param {number} unix_time unix timestamp of last modified time
 * @return {void}
 */
function fix_file_entry(name, filesize, lm_time, unix_time)
{
	var is_dup = false;	// flag if there is duplicated entry
	// the 'new' label notifies user there is new entry
	var new_label = document.createElement('span');
	new_label.className = 'label label-info';
	new_label.style.marginLeft = '10px';
	new_label.innerHTML = 'new';

	// check if there is duplicated entry
	var dup_entry = document.querySelectorAll(".file-name-hidden");
	for(var i = 0; i < dup_entry.length; i++)
		if(dup_entry[i].value == name)
		{
			var $entry_parent = $(dup_entry[i]).parents(".file-entry-row");

			$entry_parent.fadeOut(function(){
				// fix file size
				$(this).children('.f_size').html((filesize / 1024 / 1024).toFixed(2));
				// fix last modified time
				$(this).children('.f_lm_time').html(lm_time);
				// add the new label
				$(this).children('.dl-file-td').append(new_label);

				$(this).fadeIn();
			});

			is_dup = true;
			console.log("Replce file: " + name);
		}

	// there is no duplicated entry, so add new entry
	if(is_dup === false)
	{
		// adding entry back to the page
		var file_tr = document.createElement("tr");	// whole entry
		var file_des_td = document.createElement('td');	// file name part
		var file_size_td;	// file size
		var file_lm_td;	// file last modified time

		file_tr.className = "file-entry-row";
		file_tr.style.display = "none";

		// hidden frame part
		var hidden_frame = '<input type="hidden" class="file-name-hidden" value="' + name + '">';

		// checkbox element
		var app_str = '<td><input class="rm-checkbox" type="checkbox" name="rm_file[]" value="' +
						name +'" title="remove \' ' + name + ' \'"></td>';

		// file name part element
		file_des_td.title = 'click to download file';
		file_des_td.className = 'dl-file-td';
		file_des_td.innerHTML = '<i class="fa fa-file"></i>' + " &nbsp;&nbsp;" + web_filename(name);
		// append the new label
		file_des_td.appendChild(new_label);

		file_size_td = '<td class="f_size" value="' + filesize + '">' + conv_size(filesize) + '</td>';
		file_lm_td = '<td class="f_lm_time" value="' + unix_time + '">' + lm_time + '</td>';

		// construct tr elements
		$(file_tr).append(hidden_frame);
		$(file_tr).append(app_str);
		$(file_tr).append(file_des_td);
		$(file_tr).append(file_size_td);
		$(file_tr).append(file_lm_td);

		add_to_table(file_tr);

		// to display the element
		$(file_tr).fadeIn();

		// add back the download event listener
		file_des_td.addEventListener("click", function(e){
			var path = g_curr_rpath;
			send_dl_req(path, $(e.currentTarget).parents('tr').children('.file-name-hidden').attr('value'));	// from download.js
		});

		// attach the event to ALL the checkboxes
		var chbox = $(file_tr).find('.rm-checkbox')[0];	// current rm-checkbox
		var all_chbox = document.querySelector('#checkbox-all');	// checkbox for select all the checkbox
		var rm_chbox = $('.rm-checkbox');	// all the rm-checkbox in the page

		// disable select all checkbox if one the checkbox of the file is clicked
		chbox.addEventListener("click", function(e){
			all_chbox.checked = false;
		});

		chbox.addEventListener("change", function(e){
			// to enable the remove  and rename button
			if(e.currentTarget.checked)
				$(".fn-button").prop("disabled", "");
			else	// check if there is no one checked
			{
				for(var j = 0; j < rm_chbox.length; j++)
					if(rm_chbox[j].checked)	// there are still checkbox checked
						return ;

				$(".fn-button").prop("disabled", "disabled");
			}
		});
	}

	// set the new label to display a while only and then removed
	setTimeout(function(){
		// fade out the lable 'new'
		$(new_label).fadeOut(function(){
			// remove itself
			$(this).remove();
		});
	}, 10000);
}

/**
 * Updates the OSD write speed in display
 * @param {string} Write speed to be displayed 
 * @return {void}
*/
function update_write_speed(speed)
{
	$("#speed-msg").html("Write: " + speed  + " MB/s").fadeIn();
}

/**
 * Updates the number in the badge on the upload file button based on number of files which have not been uploaded
 * @return {void}
*/
function update_upload_badge()
{
	var $badge = $("#upload-file-form .badge");

	// when user uses drag-drop, not badge will appear, so we have to create one
	if($badge.length == 0)
	{
		$("#upload-file-form label").append('<span class="badge"></span>');
		$badge = $("#upload-file-form .badge");
	}

	if(g_num_files > 0)
		$badge.html(g_num_files);
	else	// no more files to upload, so remove the badge
		$badge.remove();
}
