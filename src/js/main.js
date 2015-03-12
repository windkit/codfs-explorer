/**
 * @overview Main javascript file used by index.php
 * <br>Loaded when index.php is loaded
 */

/**
 * The function loads after index.php has finished loading. It initializes the UI by
 * calling functions in different JS files. Also it does the file sorting before displaying the entries.
 * @return {void}
 */
function main()
{
	// to fix the height of the main-content
	fix_main_comp_height();
	/* note: if set it in #main-content, then the #left-main will collapse even use col-md-*, so need to set hight for borh #left-main and #right-main */
	$("#right-main").css("overflow-y", "scroll");

	window.addEventListener("resize", fix_main_comp_height);

	// the new folder button, request server to create foldedr
	document.getElementById("new-folder-btn").addEventListener("click", create_folder);	// from folder.js

	/** @requires common.js */
	// adding event to do logout
	document.querySelector('#logout-button').addEventListener("click", logout);

	// sort the file entry first
	/** @requires common.js */
	sort_file();
	// add back the sort icon
	add_sort_icon(window.sessionStorage.getItem('sort-field'), window.sessionStorage.getItem('sort-order'));

	// add event listener to change sort order and sort-key when the <th> header is clicked
	$('.sort-header').on('click', function(e) {
		var child = e.currentTarget.children;

		// check if the previous sorting key is the same as this time
		if(child.length > 0)
		{
			child[0].classList.toggle('fa-sort-asc');
			child[0].classList.toggle('fa-sort-desc');

			// toggle the session storage
			if(window.sessionStorage.getItem('sort-order') == 1)
				window.sessionStorage.setItem('sort-order', -1);
			else
				window.sessionStorage.setItem('sort-order', 1);
		}
		else // we change different sorting key
		{
			var sort_icon;
			sort_icon = document.getElementById('sort-' + window.sessionStorage.getItem('sort-field')).children[0];

			// move the icon to the new field
			e.currentTarget.appendChild(sort_icon);

			// set the new sorting key
			switch(e.currentTarget.id)
			{
				case 'sort-name':
					window.sessionStorage.setItem('sort-field', 'name');
					break;
				case 'sort-size':
					window.sessionStorage.setItem('sort-field', 'size');
					break;
				case 'sort-lm':
					window.sessionStorage.setItem('sort-field', 'lm');
					break;
			}
		}
		// finish the UI, then here do sorting
		sort_file();
	});

	// server_health_main();
	init_checkbox_event();
	/** requires upload.js */
	upload_main();	// from upload.js
	/** @requires download.js */
	download_main();
	/** @requires folder.js */
	folder_main();
	/** @requires remove.js */
	remove_main();
	/** @requires rename.js */
	rename_main();
	/** @requires user_log.js */
	user_log_main();
	/** @requires search_file.js */
	search_files_main();
}	// end of main()

/**
 * Sets the <div id="main-content"> height
 * @return {void}
 */
function fix_main_comp_height()
{
	var top_h = parseInt($("#top-comp").css("height"), 10);
	var bottom_h = parseInt($("#bottom-comp").css("height"), 10);
	var prog_h = parseInt($("#prog-bar").css("height"), 10);
	var result_h = parseInt($(window).height(), 10) - top_h - bottom_h - prog_h - 30;  // some offset is needed, if not, will have scroll bar in the window

	$("#left-main").css("max-height", result_h);
	$("#left-main").css("min-height", result_h);
	$("#right-main").css("max-height", result_h);
	$("#right-main").css("min-height", result_h);
}

/**
 * Register event for all checkbox when the page first load
 * @return {void}
 */
function init_checkbox_event()
{
	var $rm_chbox = $(".rm-checkbox");
	var all_chbox = document.getElementById("checkbox-all");

	// for checkbox to select all or de-select all
	all_chbox.addEventListener("click", function(e){
		var checked = e.currentTarget.checked;
		$('.rm-checkbox').prop('checked', checked);

		// handle the remove and rename button
		if(checked)
			enable_btn(".fn-button");
		else
			disable_btn(".fn-button");
	});

	// adding event listsner to remaining checkbox
	add_checkbox_event($rm_chbox);
}	// end of init_checkbox_event(s)

/**
 * Attaches the event to the checkbox specified by the $dom. When the checkbox is checked,
 * the remove button and rename function should be enabled and the “select-all” checkbox is de-selected
 * @param {jQuery} $dom jQuery Object of checkbox to have event listener added
 * @return {void}
 */
function add_checkbox_event($dom)
{
	$dom.on('click', function(){
		// de-select the select all checkbox
		document.getElementById("checkbox-all").checked = false;
	});

	// handle the rename and remove butston
	$dom.on('change', function(){
		// if there is still checkbox checked
		if($('.rm-checkbox:checked').length > 0)
			enable_btn(".fn-button");
		else
			disable_btn(".fn-button");
	});
}	// end of add_checkbox_event()

/**
 * Calls sort function to do the actual sort function and displays the result
 * @return {void}
 */
function sort_file()
{
	var entry_arr = [];

	// since the return of  document.getElementsByClassName() is not array object, so we need to use loop to
	// construct the array object to facilitate our sorting operation
	for(var i = 0, temp = document.getElementsByClassName('file-entry-row'), len = temp.length; i < len; i++)
		entry_arr.push(temp[i]);

	for(var i = 0, temp = document.getElementsByClassName('dir-entry-row'), len = temp.length; i < len; i++)
		entry_arr.push(temp[i]);

	// to get which field is the key
	var sort_field = window.sessionStorage.getItem('sort-field');
	// to get the sort order of the key
	// 1 -> asc, -1, -> des
	var sort_order = window.sessionStorage.getItem('sort-order');

	switch(sort_field)
	{
		case 'name':
			sort_by_name(entry_arr, sort_order);
			break;
		case 'size':
			sort_by_size(entry_arr, sort_order);
			break;
		case 'lm':
			sort_by_lm(entry_arr, sort_order);
			break;
		default:	// default sort setting when visit the page first time
			window.sessionStorage.setItem('sort-field', 'name');
			window.sessionStorage.setItem('sort-order', 1);
			sort_by_name(entry_arr, 1);
			break;
	}

	// display the result
	var tbody = document.querySelector('#file-entry-table tbody');
	// store back the previous dir if any
	var prev_dir = document.getElementById('prev-dir');
	if(prev_dir != null)
		prev_dir = prev_dir.parentNode;

	tbody.innerHTML = "";
	// append the previous dir row
	if(prev_dir != null)
		tbody.appendChild(prev_dir);
	for(var i = 0, len = entry_arr.length; i < len; i++)
	{
		tbody.appendChild(entry_arr[i]);
	}
}

/**
 * Adds the sort icon on the field according to the current order
 * @param {string} field The field being the sorting key
 * @param {number} order The sort order. > 0 represents ascending, <= 0 descending
 * @return {void}
 */
function add_sort_icon(field, order)
{
	var sort_class;
	var dom_str;
	if(order > 0)
		sort_class = 'fa-sort-asc';
	else
		sort_class = 'fa-sort-desc';

	dom_str = '<i class="fa ' + sort_class + ' sort-icon"></i>';
	$('#sort-' + field).append(dom_str);
}

window.onload = main;
