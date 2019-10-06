import * as vscode from 'vscode';

// this method is called when the extension is activated
export function activate(context: vscode.ExtensionContext) {

    const outChannel = vscode.window.createOutputChannel("clang-build");
    outChannel.appendLine('vscode clang-build extension activated');

    /////////////////////////////////////////////////////////////////////////////////////////

    const buildTypeCommandId = 'extension.selectBuildType';
    let command_selectBuildType = vscode.commands.registerCommand(buildTypeCommandId, () => {
        vscode.window.showInformationMessage('Selecting build type is not yet implemented!');

        // TODO: read file, if present
        // TODO: ask user for choice of build type
        // TODO: automate generation of file contents from dictionary
        if( vscode.workspace.workspaceFolders )
        {
            var folder = vscode.workspace.workspaceFolders[0];
            var filePath = folder.uri.fsPath + '/.clang-build-cfg.toml';
            var contents = 'build_type = [default]\ntargets = ["<all>"]';
            vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), Buffer.from(contents));

            outChannel.show();
            outChannel.appendLine('Wrote a config file '+vscode.Uri.file(filePath));
        }
        else
        {
            vscode.window.showInformationMessage('Could not select a build type because you do not have a folder opened');
        }
    });
    context.subscriptions.push(command_selectBuildType);

    /////////////////////////////////////////////////////////////////////////////////////////

    const buildCommandId = 'extension.build';
    let command_build = vscode.commands.registerCommand(buildCommandId, () => {
        vscode.window.showInformationMessage('Triggered a build!');

        // TODO: read config file, if present
        // TODO: automate generating the right command to run from parameters in the file
        const cp = require('child_process')
        if( vscode.workspace.workspaceFolders )
        {
            var folder = vscode.workspace.workspaceFolders[0];
            outChannel.show();
            outChannel.appendLine('running clang-build command');
            cp.exec('clang-build -V --debug', {cwd: folder.uri.fsPath}, (err: string, stdout: string, stderr: string) => {
                outChannel.appendLine(stdout);
                outChannel.appendLine(stderr);
                if (err) {
                    console.log('error: ' + err);
                    outChannel.appendLine('error: ' + err);
                }
            });
        }
        else
        {
            vscode.window.showInformationMessage('Could not launch build command because you do not have a folder opened');
        }
    });
    context.subscriptions.push(command_build);

    /////////////////////////////////////////////////////////////////////////////////////////

    const targetSelectionCommandId = 'extension.selectTargets';
    let command_selectTargets = vscode.commands.registerCommand(targetSelectionCommandId, () => {
        vscode.window.showInformationMessage('Selecting targets is not yet implemented!');

        // TODO: read file, if present
        // TODO: ask user for choice of target(s)
        // TODO: automate generation of file contents from dictionary
        if( vscode.workspace.workspaceFolders )
        {
            var folder = vscode.workspace.workspaceFolders[0];
            var filePath = folder.uri.fsPath + '/.clang-build-cfg.toml';
            var contents = 'build_type = [default]\ntargets = ["<all>"]';
            vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), Buffer.from(contents));

            outChannel.show();
            outChannel.appendLine('Wrote a config file '+vscode.Uri.file(filePath));
        }
        else
        {
            vscode.window.showInformationMessage('Could not select targets because you do not have a folder opened');
        }
    });
    context.subscriptions.push(command_selectTargets);

    /////////////////////////////////////////////////////////////////////////////////////////

    let status_clang_build_type: vscode.StatusBarItem;
    status_clang_build_type = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    status_clang_build_type.command = buildTypeCommandId;
    status_clang_build_type.text = `clang-build: release`;
    status_clang_build_type.show();
    context.subscriptions.push(status_clang_build_type);

    let status_clang_build_build = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    status_clang_build_build.command = buildCommandId;
    status_clang_build_build.text = `build`;
    status_clang_build_build.show();
    context.subscriptions.push(status_clang_build_build);

    let status_clang_build_targets = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    status_clang_build_targets.command = targetSelectionCommandId;
    status_clang_build_targets.text = `[all]`;
    status_clang_build_targets.show();
    context.subscriptions.push(status_clang_build_targets);
}

// this method is called when the extension is deactivated
export function deactivate() {}