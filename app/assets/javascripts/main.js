$(function(){

    function changeQuality() {
        shaderCanvas.setQuality($("#quality").slider("value") / 100);
    }

    function lookForErrors(problems) {
        var lines = problems.split("\n");
        _.each(lines, function(line){
            var lineParts = line.split(":");
            var problemType = lineParts[0];
            var lineNumber = lineParts[2];
            var problemText = lineParts[4];

            if (problemType && lineNumber && problemText) {
                var widgetElement = document.createElement('div');
                widgetElement.className = "problem";
                widgetElement.innerHTML = "<b>"+problemType+"</b>: "+problemText;

                lineWidgets.push(codeMirror.addLineWidget(lineNumber-1, widgetElement));
            }
        });
    }

    var throttleChangeQuality = _.debounce(changeQuality, 100);
    var split;
    var lineWidgets = [];

    $("#newFractal").click(function(event){
        event.preventDefault();
        codeMirror.refresh();
        $("#modal").dialog("open");
        if (!split) {
            split = $('#modal').split({
                orientation: 'vertical',
                limit: 10,
                position: '60%' // if there is no percentage it interpret it as pixels
            });
        }
        codeMirror.setValue(shaderCanvas.fragmentShaderSrc);
    });

    $("#modal").dialog({
        modal: true,
        width: 900,
        height: 500,
        autoOpen: false,
        resize: function(){
            if (split && split.refresh) {
                split.refresh();
            }
        }
    });

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
        shaderCanvas.setDimensions(parseInt($("#canvasWidth").val()), parseInt($("#canvasHeight").val()));
    });

    $("#runBtn").button().click(function(){
        _.each(lineWidgets, function(widget) {
            codeMirror.removeLineWidget(widget);
        });
        lineWidgets = [];
        var code = codeMirror.getValue();
        shaderCanvas.setFragmentShader(code);
        var problem = shaderCanvas.compileShaders();
        if (!problem) {
            shaderCanvas.draw();
        } else {
            lookForErrors(problem);
        }
    });

    $("#userLink").click(function(event){
        event.preventDefault();
        $("#userMenu").css("width", $("#userLink").width()).slideToggle();
    });

    var codeMirror = CodeMirror($("#editor")[0], {
        value: '',
        mode: "text/x-glsl",
        lineNumbers: true,
        matchBrackets: true,
        indentWithTabs: true,
        tabSize: 4,
        indentUnit: 4
    });

    var shaderCanvas = new ShaderCanvas({
        width: 400,
        height: 284,
        container: $("#canvasContainer")[0]
    });
    shaderCanvas.canvasElement.style.border = "1px solid #000";
});