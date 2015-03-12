/**
 * @overview Preform OSD write speed test and display the result
 */

/**
 * Registers the events on buttons when the page is loaded
 * @return {void}
 */
function main()
{
	$('#logout-button').on('click', logout);

	$('#speed-test-form').on('submit', function(e){
		e.preventDefault();
		speed_test(e);
	});
}

/**
 * Issues speed test request and displays the result
 * @return {void}
 */
function speed_test(e)
{
	var form = document.getElementById('speed-test-form');
	var bs_size = form['bs-field'].value;
	var num_bk = form['num-bk-field'].value;
	var spinner = '<i style="margin-top:5px;" class="fa fa-spinner fa-spin fa-4x"></i>';
	var $start_btn = $("#start-speed-test");

	$('#speed-test-form .form-group').css('display', 'none');
	$start_btn.css('display', 'none');
	$start_btn.parents('.panel-body').append(spinner);

	$.ajax({
		url: 'test_speed.php',
		dataType: 'json',
		data: {bs_size: bs_size, num_bk: num_bk},
		type: 'POST'
	}).done(function(reply, textStatus, jqXHR){
		if(reply['ret'] != 0)
			display_alert_msg('alert-msg', 'alert-danger', "Cannot complete the speed test.<br>Please check the system");
		else
		{
			// the result is in MB/s
			var read_speed = reply['read'] / (1024 * 1024);
			var write_speed = reply['write'] / (1024 * 1024);
			var table = '<table class="table table-striped"><thead>' + 
						'<tr><th colspan="2" style="text-align: center;font-size: 20px">Result<th></tr></thead>' + 
						'<tbody><tr><td>Read (MB/s)</td><td id="read-result">' + read_speed.toFixed(2) + '</td></tr>' +
						'<tr><td>Write (MB/s)</td><td id="write-result">' + write_speed.toFixed(2) + '</td></tr></tbody></table>';

			$start_btn.parents('.panel-body').html(table);
		}
	
	}).fail(function(jqXHR, textStatus, errorThrown){
			display_alert_msg('alert-msg', 'alert-danger', "Cannot connect to server.<br>Please check the system");
	});
}

window.onload = main;
