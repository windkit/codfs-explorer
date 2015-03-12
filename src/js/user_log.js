/**
 * @overview
 * Handle user history
 * @requires jQuery
 * @requires bootstrap.min.js
 */

/**
 * Requests user history from web server and displays it to client. The web server returns the dom string of user history
 * <br>Loaded from main.js
 * @return {void}
 */
function user_log_main()
{
	$("#hist-button").on('click', function(e){
		/** @requires bootstrap.min.js */
		$('#hist-popup').modal('show');
		$.ajax({
			url: 'history.php',
			type: 'POST'
		}).done(function(data, textStatus, jqXHR){
			// display the result
			document.querySelector('#hist-popup-body').innerHTML = data;
		}).fail(function(){
		
		});
	});
}

