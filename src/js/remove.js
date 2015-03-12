/**
 * @overview Handle event to remove file and empty directory via ajax
 * @requires common.js
 * @requires jQuery
 */

/**
 * Removes the files and directories via ajax when remove button is pressed 
 * <br>Called by main.js
 * @return {void}
 */
function remove_main()
{
	$("#rm-button").on("click", function(e){
		// confirm if user wants to delete file
		if(!window.confirm("Are you sure to remove the seleceted object(s)?"))
			return ;

		// to construct the query string which is contain files to be removed
		var data="";
		// if current using search table
		if($('#search-result-table').css('display') !== 'none')
		{
			var rm_filename = $('.search-rm-checkbox:checked').parents('tr').children('.search-file-name');
			var rm_filepath = $('.search-rm-checkbox:checked').parents('tr').children('.search-file-path');

			for(var i = 0, len = rm_filename.length; i < len; i++)
				data += 'rm_file[]=' + rm_filename[i].value + '&curr_rpath[]=' + rm_filepath[i].value + '&';
			data = data.substr(0, data.length - 1);	// remove the last '&'
		}
		else
		{
			var checked_entry = $('.rm-checkbox:checked').parents('tr').children('input');
			for(var i = 0, len = checked_entry.length; i < len; i++)
				data += 'rm_file[]=' + checked_entry[i].value + '&';
			data += 'curr_rpath=' + g_curr_rpath;
		}

		console.log(data);
		var rm_obj = {};
		// need to serialize the form before sending
		$.ajax({
			url: 'remove.php',
			type: 'POST',
			dataType: 'json',
			data: data
		}).done(function(data, textStatus, jqXHR){
			var warning_msg = "Failed to remove:<ol>";
			var has_err = false;

			// check if the return is remove files in search result field
			// indicate is remove in search result field if there is result['path']
			// separate the if case here because using if in for loop has hug overhead
			if(typeof data[0]['path'] != 'undefined')
			{
				var name_ele = $('.search-file-name');
				var path_ele = $('.search-file-path');
				for(var i = 0, len_i = data.length; i < len_i; i++)
				{
					// remove successfully
					if(data[i]['res'] == 0)
					{
						console.log("remove " + i + ' at path: ' + data[i]['path']);
						for(var j = 0, len_j = name_ele.length; j < len_j; j++)
							// match the name and path
							if(name_ele[j].value == data[i]['name'] && path_ele[j].value == data[i]['path'])
							{
								remove_entry(name_ele[j]);
								break;
							}
					}
					else
					{
						warning_msg += '<li>' + data[i]['name'] + '</li>';
						has_err = true;
					}
				}
			}
			else
			{
				var form_ele = $(".file-name-hidden");
				for(var i = 0, len_i = data.length; i < len_i; i++)
				{
					// remove successfully
					if(data[i]['res'] == 0)
					{
						console.log("remove file " + data[i]['name']);
						for(var j = 0, len_j = form_ele.length; j < len_j; j++)
							if(form_ele[j].value == data[i]['name'])
							{
								remove_entry(form_ele[j]);
								break;
							}
					}
					else
					{
						warning_msg += '<li>' + data[i]['name'] + '</li>';
						has_err = true;
					}
				}
			}

			// dsplay error message
			if(has_err === true)
			{
				warning_msg += '</ol>';
				display_alert_msg('alert-msg', 'alert-danger', warning_msg);
				setTimeout(function(){
					$("#alert-msg").fadeOut();
				}, 10 * 1000)
			}

			// uncheck the select all checkbox
			document.getElementById("checkbox-all").checked = false;

			// to disable the remove button if there no more checkbox checked
			var rm_chkbox = document.getElementsByClassName("rm-checkbox");
			for(var i = 0; i < rm_chkbox.length; i++)
				if(rm_chkbox[i].checked)
					return ;
			$("#rm-button").prop("disabled", "disabled");
		});	// end of done()
	});
}	// end of remove_main()

/**
 * Removes the row which contains the selector
 * @param {Obeject} dom HTML DOM object of which the entry is to be removed
 * @return {void}
 */
function remove_entry(dom)
{
	// remove the row after finishing fadeIn
	$(dom).parents("tr").fadeOut(function(){
		$(this).remove();
	});
}	// end o remove_entry()
