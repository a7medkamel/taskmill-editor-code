// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');

var rp  = require('request-promise')
  , _   = require('lodash')
  ;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "taskmill" is now active!'); 

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	var disposable = vscode.commands.registerCommand('extension.run_git', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		// vscode.window.showInformationMessage('Hello World!');
        
        var opts = {
            url     : 'https://taskmill.io/script/search'
          , json    : true
        };
        
        var editor = vscode.window.activeTextEditor;
        
        vscode.window
                .showQuickPick(rp.get(opts).then(function(result){
                    return _.map(result, function(item){ return _.extend(item, { description : item.name }); });
                }))
                .then(function(chosen) {
                    if (chosen) {
                        var text = undefined;
                        if (editor) {
                             text = editor.document.getText(editor.selection);
                        }
                        
                        var opts = {
                            method                  : 'GET'
                          , url                     : chosen.run_url
                          , resolveWithFullResponse : true
                        };
                        
                        if (text) {
                            opts.method = 'POST';
                            opts.body = text;
                        }
                        
                        return rp(opts);
                    }
                })
                .then(function (response) {
                    if (editor) {
                        var sel = editor.selection;
                        
                        return editor.edit(function(edit){
                            var result = response.body;
                            if (sel.start.compareTo(sel.end) === 0) {
                                edit.insert(sel.start, result);
                            } else {
                                var type = response.headers['$type'];
                                if (type === 'generate') {
                                    edit.insert(sel.end, result);
                                } else {
                                    edit.replace(sel, result);   
                                }
                            } 
                        });
                    }
                })
                ;
	});
	
	context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;