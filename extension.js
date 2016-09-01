// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode  = require('vscode')
  , _       = require('lodash')
  ;

var taskmill_cli = require('taskmill-cli');

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
        
        var editor = vscode.window.activeTextEditor;
        
        vscode.window
                .showQuickPick(taskmill_cli.search().then(function(result){
                    return _.map(result, function(item){ return _.extend(item, { description : item.description || '', detail : item.html_url || '', label: item.title || '' }); });
                }))
                .then(function(chosen) {
                    if (chosen) {
                        var text = undefined;
                        if (editor) {
                             text = editor.document.getText(editor.selection);
                        }
              
                        taskmill_cli
                            .run(chosen.run_url, text)
                            .then(function(result){
                                if (result.encoding != 'binary' && editor) {
                                    return result
                                            .readFile()
                                            .then(function(text){
                                                var sel = editor.selection;
                                                return editor.edit(function(edit){
                                                        if (sel.start.compareTo(sel.end) === 0) {
                                                            edit.insert(sel.start, text);
                                                        } else {
                                                            var pragma = result.pragma;
                                                            var re = /^editor\s+(\w+)$/; 
                                                            var directive = _.chain(pragma)
                                                                            .map(function(pragma) {
                                                                                var m = undefined;
                                                                                if (m = re.exec(pragma)) {
                                                                                    return m[1];
                                                                                }
                                                                            })
                                                                            .compact()
                                                                            .first()
                                                                            .value();
                                                          
                                                            if (directive === 'replace') {
                                                                edit.replace(sel, text);   
                                                            } else {
                                                                edit.insert(sel.end, '\n' + text);
                                                            }
                                                        } 
                                                    }); 
                                            });
                                } else {
                                    return result.open();                                                                   
                                }
                            });
                    }
                })
                .catch(function(err) {
                    console.error(err);
                });
	});
	
	context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;