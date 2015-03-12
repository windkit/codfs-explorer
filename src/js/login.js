/**
 * @overview Used in login.html to do login
 * @requries jQuery
 */

window.onload = main;

/**
 * Calls login() if user wants to login. The function handles "remember me"
 * and redirects to index page if user has correct session
 * <bar>Handle "remember me", redirect to index page if user has correct session
 * <br>Called when the the web page is loaded
 * @return {void}
 */
function main()
{
	// doing form submission when login
	$('#login-form').on('submit', function(e){
		e.preventDefault();
		login();
	});
	
	// if valid session is found, prompt user to normal mode
	if(check_session() === false)
		// display the content as by default it is hidden
		document.querySelector('body').style.display = 'block';
	else
		window.location =  url_without_doc();
}

/** 
 * Requests web server to log a user in
 * @return {void}
 */
function login()
{
	var form = document.getElementById('login-form');

	$.ajax({
		type: 'POST',
		url: 'login.php',
		dataType: 'json',
		data: {name: form['username'].value, 
				passwd: form['passwd'].value}
	}).done(function(reply, textStatus, jqXHR){

		if(reply['result'] != 0)
			display_alert_msg('alert-msg', 'alert-danger', "Wrong user name or password");
		else
		{
			var url = url_without_doc();

			if(form['admin-mode'].checked)
				window.location = url + "dashboard.php";
			else	// redirect to the upload page for normal user
				window.location = url;
		}
	}).error(function(jqXHR, textStatus, errorThrown){
		display_alert_msg('alert-msg', 'alert-danger', "Server Error");
	});
}

/*
 * Query Web server is the user contain the correct session or not via ajax
 * @return {boolean} return false is no valid session, ture clients has valid session
 */
function check_session()
{
	/** @requires common.js */
	var user = getCookie('user');
	var sess = getCookie('sess');

	// check if user has the cookie
	if(!sess || !user)
		return false
	else
	{
		$.ajax({
			type: 'POST',
			dataType: 'json',
			url: 'validate_session.php',
		}).done(function(reply, textStatus, jqXHR){

			if(reply['valid'] == 0)
				return true;
			else
				return false;
		}).fail(function(){
			return false;
		});

	}
}

