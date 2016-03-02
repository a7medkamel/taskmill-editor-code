// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');

var rp              = require('request-promise') 
  , request         = require('request') 
  , _               = require('lodash')
  , fs              = require('fs-extra')
  , open            = require('open')
  , tmp             = require('tmp')
  , mime            = require('mime-type/with-db')
  , Promise         = require('bluebird')
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
                    return _.map(result, function(item){ return _.extend(item, { description : item.description || '', detail : item.html_url || '', label: item.title || '' }); });
                }))
                .then(function(chosen) {
                    if (chosen) {
                        var text = undefined;
                        if (editor) {
                             text = editor.document.getText(editor.selection);
                        }
                        
                        var opts = {
                            method  : 'GET'
                          , url     : chosen.run_url
                        };
                        
                        if (text) {
                            opts.method = 'POST';
                            opts.body = text;
                        }
                        
                        return Promise
                                .promisify(tmp.tmpName)({ prefix : 'taskmill-'/*, postfix : '.tmp'*/ })
                                .then(function(filename) {
                                    return new Promise(function(resolve, reject){
                                        var res = request(opts)
                                                    .on('response', function(response) {
                                                        var ext             = mime.extension(response.headers['content-type'])
                                                          , enc             = mime.charset(response.headers['content-type']) || 'binary'
                                                          ;
                                                        
                                                        if (ext) {
                                                            filename = filename + '.' + ext;   
                                                        }
                                                        
                                                        var to = fs.createOutputStream(filename, { defaultEncoding : enc });
                                                        
                                                        res.pipe(to)
                                                            .on('finish', function () {
                                                                var ret = undefined;
                                                                if (enc != 'binary' && editor) {
                                                                    ret = Promise
                                                                            .promisify(fs.readFile)(filename, { encoding : enc })
                                                                            .then(function(text){
                                                                                var sel = editor.selection;
                                                                                return editor.edit(function(edit){
                                                                                        if (sel.start.compareTo(sel.end) === 0) {
                                                                                            edit.insert(sel.start, text);
                                                                                        } else {
                                                                                            var type = response.headers['$type'];
                                                                                            if (type === 'generate') {
                                                                                                edit.insert(sel.end, text);
                                                                                            } else {
                                                                                                edit.replace(sel, text);   
                                                                                            }
                                                                                        } 
                                                                                    }); 
                                                                            });
                                                                } else {
                                                                    open(filename);                                                                   
                                                                }
                                                                
                                                                resolve(ret);
                                                            })
                                                            .on('error', function(err){
                                                                reject(err);
                                                            }); 
                                                    })
                                                    .on('error', function(err){ reject(err); });
                                    }); 
                                });
                    }
                })
                .catch(function(err) {
                    console.error(err);
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