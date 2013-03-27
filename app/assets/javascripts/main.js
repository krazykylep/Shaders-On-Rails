$(function(){

    var throttleChangeQuality = _.debounce(changeQuality, 100);
    var split;
    var lineWidgets = [];
    var shaders = [];
    var defaultFragmentShader;
    var errorLineOffset = 0;
    var codeChanged = false;

    function changeQuality() {
        shaderCanvas.setQuality($("#quality").slider("value") / 100);
    }

    function getUserName() {
        var val = $("#userLink").html();
        return val === 'Logged In' ? null : val;
    }

    function getShaderCode() {
        var shader = codeMirror.getValue();
        errorLineOffset = 0;
        if (!shader.match(/precision+(\s+)+highp+(\s+)+float/i)) {
            shader = "#ifdef GL_ES\nprecision highp float;\n#endif\n" + shader;
            errorLineOffset = 3;
        }
        return shader;
    }

    function lookForErrors(problems) {
        var lines = problems.split("\n");
        _.each(lines, function(line) {
            var lineParts = line.split(":");
            var problemType = lineParts[0];
            var lineNumber = lineParts[2];
            var problemText = lineParts[3] + ' ' + lineParts[4];

            if (problemType && lineNumber && problemText) {
                var widgetElement = document.createElement('div');
                widgetElement.className = "problem";
                widgetElement.innerHTML = "<b>"+problemType+"</b>: "+problemText;

                lineWidgets.push(codeMirror.addLineWidget(lineNumber-1-errorLineOffset, widgetElement));
            }
        });
        codeMirror.refresh();
    }

    function createShaderMarkup(shader) {
        var div = $('<div class="shader"><img><span></span></div>');
        var image = div.find('img');
        var span = div.find('span');
        var newId = shaders.length;
        shaders.push(shader);

        image.attr("src", shader.image);
        image.attr("alt", shader.title);
        image.attr("data-id", newId);

        span.text(shader.title);
        span.attr("data-id", newId);

        div.attr("data-id", newId);
        div.click(function(e) {
            $("#modal").dialog("open");
            var data = shaders[$(e.target).attr("data-id")] || {};
            setupEditor(data);
        });

        return div;
    }

    function appendShaders(data) {
        _.each(data, function(shader) {
            $("#shaders").append(createShaderMarkup(shader));
        });
    }

    function fetchShaders(userId) {
        fetchShaders.offset = fetchShaders.offset === undefined ? 0 : fetchShaders.offset;
        var data = {
            number: 16,
            offset: fetchShaders.offset
        }
        if (userId) {
            data.userId = userId;
        }
        var firstFetch = fetchShaders.offset === 0;
        $.ajax({
            type: 'GET',
            url: '/get',
            data: data,
            dataType: 'json',
            success: function(data){
                if (firstFetch && data.length === 0) {
                    $("#shaders").html("<span class='message'>You have no shaders.</span>");
                } else {
                    appendShaders(data);
                }
            }
        });
        fetchShaders.offset += 16;
    }

    function getLatestShader() {
        $.ajax({
            type: 'GET',
            url: '/get',
            data: {
                number: 1,
                offset: 0
            },
            dataType: 'json',
            success: function(data){
                var shader = data[0];
                $("#shaders").prepend(createShaderMarkup(shader));
            }
        });
    }

    function compileShaderAndDraw() {
        _.each(lineWidgets, function(widget) {
            codeMirror.removeLineWidget(widget);
        });
        lineWidgets = [];
        var code = getShaderCode();
        shaderCanvas.setFragmentShader(code);
        var problem = shaderCanvas.compileShaders();
        if (!problem) {
            codeChanged = false;
            shaderCanvas.draw();
        } else {
            lookForErrors(problem);
        }
    }

    function setupEditor(data) {
        data = data || {};
        codeMirror.refresh();
        if (!split) {
            split = $('#modal').split({
                orientation: 'vertical',
                limit: 10,
                position: '60%' // if there is no percentage it interpret it as pixels
            });
        }
        $("#canvasName").val(data.title || 'Untitled');
        $("#canvasAuthor").val(data.author || getUserName() || 'Anonymous');
        $("#canvasWidth").val(data.width || '400');
        $("#canvasHeight").val(data.height || '284');
        $("#quality").slider("value", 100);

        resizeShaderCanvas();
        codeMirror.setValue(data.code || defaultFragmentShader);
        compileShaderAndDraw();
    }

    function resizeShaderCanvas() {
        var width = parseInt($("#canvasWidth").val());
        var height = parseInt($("#canvasHeight").val());
        if(!isNaN(width) && !isNaN(height)) {
            width = Math.max(width, 1);
            height = Math.max(height, 1);
            shaderCanvas.setDimensions(width, height);
        }
    }

    $("#newShader").click(function(event){
        event.preventDefault();
        $("#modal").dialog("open");
        setupEditor();
    });

    $("#modal").dialog({
        modal: true,
        width: $(window).width()-50,
        height: $(window).height()-50,
        autoOpen: false,
        open: function(){
            shaderCanvas.animate();
        },
        close: function(){
            shaderCanvas.stopAnimation();
        },
        resize: function(){
            if (split && split.refresh) {
                split.refresh();
            }
        }
    });

    $("#message").dialog({
        modal: true,
        title: 'Submitting',
        autoOpen: false,
        closeOnEscape: false,
        draggable: false,
        resizable: false
    });
    $("#message").parent().find('button').remove();

    $("#quality").slider({
        orientation: "horizontal",
        range: "min",
        max: 100,
        min: 10,
        value: 100,
        slide: throttleChangeQuality,
        change: throttleChangeQuality
    });

    $("#dimensionBtn").button().click(function(){
        resizeShaderCanvas();
    });

    $("#runBtn").button().click(function(){
        compileShaderAndDraw();
    });

    $("#pauseBtn").button().click(function() {
        if ($(this).button('option', 'label') === 'Stop') {
            $(this).button('option', 'label', 'Start');
            shaderCanvas.stopAnimation();
        } else {
            $(this).button('option', 'label', 'Stop');
            shaderCanvas.animate();
        }
    });

    $("#submitBtn").button().click(function(){
        if (!codeChanged) {
            $("#message").dialog('open');
            var width = $("#canvasWidth").val();
            var height = $("#canvasHeight").val();
            shaderCanvas.setDimensions(215, 153);
            $("#quality").slider("value", 100);
            shaderCanvas.oneTimeDrawCallback = function(){
                var src = shaderCanvas.canvasElement.toDataURL();
                $.ajax({
                    type: 'POST',
                    url: '/new',
                    data: {
                        width: width,
                        height: height,
                        code: codeMirror.getValue(),
                        title: $("#canvasName").val(),
                        author: $("#canvasAuthor").val(),
                        image: src
                    },
                    success: function(user){
                        getLatestShader();
                    },
                    complete: function(){
                        $("#modal").dialog("close");
                        $("#message").dialog('close');
                    }
                });
            }
            if (!shaderCanvas.animating) {
                shaderCanvas.draw();
            }
        } else {
            alert("Please recompile your shader first.");
        }
    });

    $("#userLink").click(function(event){
        event.preventDefault();
        var userLink = $("#userLink");
        var userLinkPosition = userLink.position();
        var userMenu = $("#userMenu");
        userMenu.css({
            top: userLinkPosition.top+20+"px",
            left: userLinkPosition.left+"px"
        });
        userMenu.css("width", userLink.width()).slideToggle();
    });

    var codeMirror = CodeMirror($("#editor")[0], {
        value: '',
        mode: "text/x-glsl",
        lineNumbers: true,
        matchBrackets: true,
        indentWithTabs: true,
        tabSize: 4,
        indentUnit: 4,
        onKeyEvent: function(editor, event) {
            codeChanged = true;
        }
    });

    var shaderCanvas = new ShaderCanvas({
        width: 400,
        height: 284,
        container: $("#canvasContainer")[0]
    });
    shaderCanvas.canvasElement.style.border = "1px solid #000";
    defaultFragmentShader = 'uniform vec2 size;\n\
uniform float time;\n\
\n\
void main(void) {\n\
    vec4 pos = gl_FragCoord;\n\
    float red = sin(time);\n\
    float green = pos.y / size.y;\n\
    float blue = 1.0 - red - green;\n\
    float alpha = 1.0;\n\
    gl_FragColor = vec4(red, green, blue, alpha);\n\
}';

    var possibleUserId = $("#shaders").attr("data-id");
    fetchShaders(possibleUserId);
});