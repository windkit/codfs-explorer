/**
 * @overall To request searching and display search result
 * @requires jQuery
 */

/**
 * Sets up event listener on search field. When client inputs any character in the search
 * field, the web server will be queried at once 
 * <br>Loaded by main.js
 * @return {false}
 */
function search_files_main()
{
	// when user press enter to search the file
	document.getElementById('search-file-form').addEventListener('submit', function(e){
		// prevent the default submit, which is the page itself
		e.preventDefault();
		search_file(e);
	});

	// display the search result once user input characters, act like google search in search bar
	// when user clean up the search field, it will display back the file in current directory
	document.getElementById('search-file-field').addEventListener('input', function(e){
		// user didn't input anything
		if(e.currentTarget.value === "")
			hide_search_result();
		else
		{
			// display the cancel icon
			$("#cancel-search-icon").fadeIn('fast');
			search_file(e);
		}
	});

	// when the cancel search icon is pressed
	document.getElementById('cancel-search-icon').addEventListener('click', function(e){
		// remove the words in the input field
		document.getElementById('search-file-field').value="";
		// display back the files in the current directory
		hide_search_result();
	});
}

/*
 * Request search file base on keyword via ajax
 * return {void}
 */
function search_file()
{
	var search_word = document.getElementById("search-file-field").value;

	$.ajax({
		data: {filename: search_word},
		type: 'POST',
		url: 'search_file.php',
		dataType: 'json' 
	}).done(function(data){
		sort_search_result(data['result']);
		display_search_result(data);
	}).fail(function(){
		console.log('Error to connect the server to find search result');
	});
}

/**
 * Displays the search result on the table
 * @param {json} result JSON containing the search result
 * @return {void}
 */
function display_search_result(result)
{
	var search_result = result['result'];
	var $tbody = $('#search-result-table tbody');
	var search_str = result['search_str'];
	var dom = '';
	// filename embedded with html tag
	var display_filename = '';

	// using regular expression to adding tag in between the matched word
	// global case insensitive search
	var re = new RegExp('(' + search_str + ')', 'i');
	var re2 = new RegExp('/(.+)/', 'i');
	// regular expression pattern to embed tag to the matched strong on replace the string
	var new_pattern = '<strong class="text-primary">$1</strong>';

	// loop through the array and append the reuslt into the table
	for(var i = 0, len = search_result.length; i < len; i++)
	{
		// adding tag to highlight the matched keyword
		// by replace the matched word with the pattern specified by variable new_pattern
		// 1. identidy the location of keyword by using  '/' as the bound, e.g. f/il/e a
		// 2. convert all the  ' ' to &nbsp;
		// 3. convert the '/' from result 2 back to tag, i.e. f<strong ..>il</strong>e&nbsp;a
		// the result of adding '/' as bound tne convert back to tag is because the tag contain space
		// which step 2 will convert space in the tag to &nbsp;
		display_filename = search_result[i]['name'].replace(re, '/$1/');
		display_filename = web_filename(display_filename);
		display_filename = display_filename.replace(re2, new_pattern);

		dom += '<tr>' + '<input type="hidden" class="search-file-path" value="' + search_result[i]['path'] + '"">' +
				'<input type="hidden" class="search-file-name" value="' + search_result[i]['name'] + '">' +
				'<td><input type="checkbox" class="search-rm-checkbox"></td>' +
				'<td class="search-file-td"><i class="fa fa-file"></i> &nbsp;&nbsp;' + display_filename + '</td>'+
				'<td>'+ search_result[i]['path'] + '</td></tr>';
	}

	// clean up previous result
	$tbody.html("");
	$tbody.append(dom);

	// hide the original table which contain files information of the current directory
	document.getElementById('file-entry-table').style.display = 'none';

	// display search result table
	$('#search-result-table').fadeIn('fast');

	// attach the event where when the filename is clicked, to trigger file download
	$('.search-file-td').on('click', function(e){
		var path = $(this).prevAll(".search-file-path").attr('value');
		var filename = $(this).prevAll(".search-file-name").attr("value");

		// download file, from download.js
		send_dl_req(path, filename);
	});

	// enable the function button, which are the remove button and rename button
	$('.search-rm-checkbox').on('change', function(){
		if($('.search-rm-checkbox:checked').length > 0)
			enable_btn('#rm-button');
			// enable_btn('.fn-button');
		else
			disable_btn('#rm-button');
			// disable_btn('.fn-button');
	});
}
/**
 * Sorts the search result by name in accending order
 * @param {HTML_DOM[]} res_arr the array of dom objects which needs to be sorted by name
 * @return {void}
 */
function sort_search_result(res_arr)
{
	res_arr.sort(function(a, b){
		/** @requires common.js */
		var ret = cmp_name(a['name'], b['name']);

		return ret;
	});
}

/**
 * hide the search result table when user cancels the search by
 * <br>1. pressing the cross icon
 * <br>2. clearing all the input in the input field
 * @return {void}
*/
function hide_search_result()
{
	document.getElementById('cancel-search-icon').style.display = 'none';
	document.getElementById('search-result-table').style.display = 'none';
	// display back files entry of the current directory
	document.getElementById('file-entry-table').style.display = '';
	// disable all button
	disable_btn('.fn-button');
}
