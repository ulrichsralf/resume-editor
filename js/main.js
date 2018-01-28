// Global by intention.
var builder;

var default_resume_file = "json/resume.json";
var imported_resume_file = "";

jQuery(document).ready(function($) {
	var form = $("#form");
	builder = new Builder(form);

	$.getJSON("json/schema.json", function(data) {
		builder.init(data);
		reset(default_resume_file);
	});

	var preview = $("#preview");
	var iframe = $("#iframe");

	(function() {
		var timer = null;
		form.on("change", function() {
			clearTimeout(timer);
			preview.addClass("loading");
			timer = setTimeout(function() {
				var data = builder.getFormValues();
				form.data("resume", data);
				postResume(data);
			}, 200);
		});
	})();

	function postResume(data) {
		var theme = "flat";
		var hash = window.location.hash;
		if (hash != "") {
			theme = hash.replace("#", "");
		}
		$.ajax({
			type: "POST",
			contentType: "application/json",
			data: JSON.stringify({resume: data}, null, "  "),
			url: "http://themes.jsonresume.org/" + theme,
			success: function(html) {
				iframe.contents().find("body").html(html);
				preview.removeClass("loading");
			}
		});
		(function toggleActive() {
			$("#theme-current").html(theme);
			var active = $("#themes-list .item[href='#" + theme + "']").addClass("active");
			active.siblings().removeClass("active");
		})();
	}

	enableTSEplugin();
	enableCSStransitions();

	$("#export").on("click", function() {
		var data = form.data("resume");
		download(JSON.stringify(data, null, "  "), "resume.json", "text/plain");
	});
	$("#export").tooltip({
		container: "body"
	});

	$("#import").on("click", function() {
		$("#file_upload").val(null);
		$("#file_upload").click();
	});

	$('input[type=file]').change(function(event) {
		var files = document.getElementById('file_upload').files;

		if(files && files.length > 0 && files[0].name.length > 0){
			var fileName = files[0].name;
			files=[];
			if (confirm("Are you sure?\n\nThis will remove any edits and change entries to the selected resume file.")) {
				importResume(fileName);
			}
		}
		else {
			alert("No file selected");
		}
	});

	$("#reset").on("click", function() {
		if (confirm("Are you sure?\n\nThis will remove any edits and reset to the default resume file.")) {
			reset(default_resume_file);
		}
	});

	$("#clear").on("click", function() {
		if (confirm("Are you sure?\n\nThis will revert the editor to a blank resume file.")) {
			clear();
		}
	});

	var tabs = $("#sidebar .tabs a");
	tabs.on("click", function() {
		var self = $(this);
		self.addClass("active").siblings().removeClass("active");
	});

	(function getThemes() {
		var list = $("#themes-list");
		var item = list.find(".item").remove();
		$.getJSON("http://themes.jsonresume.org/themes.json", function(json) {
			var themes = json.themes;
			if (!themes) {
				return;
			}
			for (var t in themes) {
				var theme = item
					.clone()
					.attr("href", "#" + t)
					.find(".name")
					.html(t)
					.end()
					.find(".version")
					.html(themes[t].versions.shift())
					.end()
					.appendTo(list);
			}
		});
		list.on("click", ".item", function() {
			form.trigger("change");
		});
	})();

	var jsonEditor = $("#json-editor");

	(function() {
		var timer = null;
		jsonEditor.on("keyup", function() {
			clearTimeout(timer);
			timer = setTimeout(function() {
				try {
					var text = jsonEditor.val();
					builder.setFormValues(JSON.parse(text))
				} catch(e) {
					// ..
				}
			}, 200);
		});
	})();

	form.on("change", function() {
		var json = builder.getFormValuesAsJSON();
		if (jsonEditor.val() !== json) {
			jsonEditor.val(json);
		}
	});

	$("#sidebar .view").on("click", "a", function(e) {
		e.preventDefault();
		var self = $(this);
		var type = self.data("type");
		self.addClass("active").siblings().removeClass("active");
		jsonEditor.toggleClass("show", type == "json");
	});
});

function reset(resume_file) {
	$.getJSON(resume_file, function(data) {
		builder.setFormValues(data);
	});
}

function importResume(fileName) {
	imported_resume_file = "json/" + fileName;
	reset(imported_resume_file);
}

function clear() {
	builder.setFormValues({});
}

function enableTSEplugin() {
	var preview = $("#preview");
	var scrollable = $(".tse-scrollable");
	scrollable.TrackpadScrollEmulator();
	scrollable.on("startDrag", function() {
		preview.addClass("scroll");
	});
	scrollable.on("endDrag", function() {
		preview.removeClass("scroll");
	});
}

function enableCSStransitions() {
	setTimeout(function() {
		$("body").removeClass("preload");
	}, 200);
}
