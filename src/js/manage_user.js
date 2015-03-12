/**
 * @overview Send request to add and remove use.
 * <br>Loaded when manager_user.php finish loading
 * @requires common.js
 * @requires jQuery
 */

/**
 * Attaches event listener to buttons. Triggered when the web page has finished loading
 * @return {void}
 */
function main()
{
	var chkboxes = $("#user-table tbody input:checkbox");

	// when select all checkbox is clicked
	document.querySelector("#select-all-chkbox").addEventListener("click", function(e){
		var state = e.currentTarget.checked;

		chkboxes.prop('checked', state);

		// fix the remove button display
		if(state)
			enable_btn("#remove-btn");
		else
			disable_btn("#remove-btn");
	});

	// when it is clicked, should not select all chkbox
	chkboxes.on("change", chkbox_event);

	// form submission for adding user
	$("#add-user-form").on("submit", function(e){
		e.preventDefault();
		add_user(e.currentTarget);
	});

	// when remove button is clicked, call to remove user
	document.querySelector('#remove-btn').addEventListener('click', del_user);

	// when the remove button is clicked
	/** @requires common.js */
	document.querySelector('#logout-button').addEventListener('click', logout);
}

/**
 * Requests server to add user and add the entry back to the web page
 * @param {Object} form_data HTML DOM object - a form which contains the username, password and the confirmed password fields
 * @return {void}
 */
function add_user(form_data)
{
	var name = form_data['name'].value, passwd = form_data['passwd'].value, conf = form_data['conf-passwd'].value;

	// search for any illeage character

	if(name.search(/[\/:?&<>"'|\s\\]/g) > -1)
	{
		display_alert_msg("ret-msg", "alert-danger", 'User name cannot contain any space and any of the characters: \\ / : ? & < > " \' |');
		return ;
	}

	// double check the password
	if(passwd !== conf)
	{
		display_alert_msg("ret-msg", "alert-danger", "Password and Confirm Password do not match");
		return ;
	}
	console.log("Add user now");

	$.ajax({
		url: 'add_user.php',
		type: 'POST',
		dataType: 'json',
		data: {name: name, passwd: passwd},
	}).done(function(reply, textStatus, jqXHR){
		switch(reply['ret'])
		{
			case 1:	// failed case
			case 2:	// illegal character found
			case 3:	// forbidden user name
				display_alert_msg("ret-msg", "alert-danger", reply['msg']);
				break;
			case 0:	// success case
				// put back the result on the page
				var new_tr = document.createElement('tr');
				var target = document.querySelector('#user-table tbody').lastChild;

				// set it to not display, so later we can call for fadeIn()
				new_tr.style.display = "none";
				new_tr.innerHTML = '<td><input type="checkbox"></td>' +
								   '<td title="' +  name + '"><i class="fa fa-user"></i> &nbsp;<span class="name-field">' +
								   name + '</span></td>';
				// append to the end of the list
				$(target).before(new_tr);
				$(new_tr).fadeIn();
				// add back the event for checkbox
				$(new_tr).find("input:checkbox").on('change', chkbox_event);
				display_alert_msg("ret-msg", "alert-success", reply['msg']);

				// clean up the input flied to accept next input
				form_data['name'].value = "";
				form_data['passwd'].value = "";
				form_data['conf-passwd'].value = "";
				break;
		}
	}).fail(function(){
		display_alert_msg("ret-msg", "alert-danger", "Cannot connect to server");
	});
}


/**
 * Removes user via ajax, then removes the entry from the web page
 * @return {void}
 */
function del_user()
{
	var name_field = $("#user-table input:checked").parents("tr").find("td .name-field");
	var names = [];
	for(var i = 0, len = name_field.length; i < len; i++)
		names.push(name_field[i].innerHTML);

	$.ajax({
		url: 'remove_user.php',
		type: 'POST',
		dataType: 'json',
		data: {name: names},
	}).done(function(reply, textStatus, jqXHR){
		// remove all the success record on from the page
		var succ_list, fail_list;
		var tr_tag = $("#user-table tbody tr");
		for(var i = 0, len1 = reply['succ'].length; i < len1; i++)
		{
			for(var j = tr_tag.length - 1, len2 = 0; j >= len2; j--)
			{
				if($(tr_tag[j]).find('.name-field').html() == reply['succ'][i])
				{
					/*
					 * set it not checked because the late call for the change_remove_btn_state() will
					 * check for any checked checkbox and disable the remove button
					 * the remove() will be called once the fadeOut() finish, which takes time. By the time
					 * change_remove_btn_state() is called, the element may not be removeed and the change_remove_btn_state()
					 * will detect checked checkbox which will not disable the button, hence we uncheck here
					 */
					$(tr_tag[j]).find('input').prop('checked', false);
					// to make the record disappear from the record
					$(tr_tag[j]).fadeOut(function(){
						$(this).remove();
					});
					tr_tag.splice(i, 1);
				}
			}
		}

		change_remove_btn_state();
		// display message
		if(reply['fail'].length == 0)
			display_alert_msg("ret-msg", "alert-success", 'Deleted user successfully');
		else
			display_alert_msg("ret-msg", "alert-danger", 'Some user cannot be remove');

	}).fail(function(){
		display_alert_msg("ret-msg", "alert-danger", "Cannot connect to server");
	});
}

/**
 * Installs event listener for the checkboxes. The possible triggered functions include the
 * de-selection of “select all” checkbox and the activation of remove button
 * @return {void}
 */
function chkbox_event()
{
	// to disable the select all checkbox when one of the checkbox is clicked
	document.querySelector("#select-all-chkbox").checked = false;
	change_remove_btn_state();
}

/**
 * Changes the remove button state based on number of checked checkboxes
 * @return {void}
 */
function change_remove_btn_state()
{
	// to enable Remove Button if there is checked checckbox
	if($("#user-table tbody input:checked").length == 0)
		disable_btn("#remove-btn");
	else
		enable_btn("#remove-btn");
}

window.onload = main;
