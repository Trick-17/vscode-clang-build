import * as vscode from 'vscode';

const child_process = require('child_process');


class InteractiveProcessHandle {
    private process: any;

    public outputLog: string;
    public latestOutput: string;

    private processToPromise(process: any) {
        return new Promise<string>((resolve, reject) => {
            console.log("+++ creating promise");
            process.stdout.removeAllListeners();
            process.stderr.removeAllListeners();
            process.stdin.removeAllListeners();

            let lastString: string = '';

            process.stdout.on("data", (data: any) => {
                data = data.toString().trim();
                this.update(data);
                if (data.endsWith('>>>')) {
                    resolve(lastString);
                }
                lastString = data;
            });
            process.stderr.on("data", (data: any) => {
                data = data.toString().trim();
                this.update(data);
                if (data.endsWith('>>>')) {
                    resolve(lastString);
                }
                lastString = data;
            });
            process.stdin.on("error", () => {
                console.log("Failure in stdin! ... error");
                reject();
            });
            process.stdin.on("close", () => {
                console.log("Failure in stdin! ... close");
                reject();
            });
            process.stdin.on("end", () => {
                console.log("Failure in stdin! ... end");
                reject();
            });
            process.stdin.on("disconnect", () => {
                console.log("Failure in stdin! ... disconnect");
                reject();
            });
            process.stdout.on("error", () => {
                console.log("Failure in stdout! ... error");
                reject();
            });
            process.stdout.on("close", () => {
                console.log("Failure in stdout! ... close");
                reject();
            });
            process.stdout.on("end", () => {
                console.log("Failure in stdout! ... end");
                reject();
            });
            process.stderr.on("error", () => {
                console.log("Failure in stderr! ... error");
                reject();
            });
            process.stderr.on("close", () => {
                console.log("Failure in stderr! ... close");
                reject();
            });
            process.stderr.on("end", () => {
                console.log("Failure in stderr! ... end");
                reject();
            });
            console.log("+++ done creating promise");
        });
    }

    private update(data: any) {
        this.latestOutput = data;
        this.outputLog += data + "\n";
        console.log(`logging from update: "${data}"`);
    }

    public call(command: string): Promise<string> {
        console.log(`called: "${command.trim()}"`);
        let promise = this.processToPromise(this.process);
        this.process.stdin.write(command);
        return promise;
    }

    constructor(call: any, options: any) {
        this.latestOutput = "";
        this.outputLog = "";

        this.process = child_process.spawn(call, options, { shell: true });
        this.process.stdout.setEncoding('utf8');
        this.process.stderr.setEncoding('utf8');
    }
};


// This method is called when the extension is activated
export async function activate(context: vscode.ExtensionContext) {
    const outChannel = vscode.window.createOutputChannel("clang-build");
    outChannel.appendLine('activating vscode clang-build extension');

    let status_clang_build_type: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    let status_clang_build_build: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    let status_clang_build_targets: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);

    const buildTypeCommandId = 'extension.selectBuildType';
    const buildCommandId = 'extension.build';
    const targetSelectionCommandId = 'extension.selectTargets';

    // ---------------------------------------------------------------------
    var clang_build = new InteractiveProcessHandle('python', ['-i']);
    if (vscode.workspace.workspaceFolders) {
        var folder = vscode.workspace.workspaceFolders[0];

        await clang_build.call('');
        await clang_build.call('import sys\n');
        await clang_build.call('import clang_build\n');
        await clang_build.call('args = clang_build.clang_build.parse_args(sys.argv[1:])\n');
        await clang_build.call('environment = clang_build.environment.Environment(args)\n');
        await clang_build.call('environment.set_working_directory(r"' + folder.uri.fsPath + '")\n');
        await clang_build.call('print("--- environment created")\n');
        await clang_build.call('project = clang_build.project.Project.from_directory(r"' + folder.uri.fsPath + '", environment)\n');
        await clang_build.call('print("--- project created")\n');

        let command_selectBuildType = vscode.commands.registerCommand(buildTypeCommandId, () => {
            const result = vscode.window.showQuickPick(
                ['Default', 'Release', 'Debug', 'RelWithDebInfo', 'Coverage'],
                { placeHolder: 'Build type', }
            ).then((result) => {
                if (result) {
                    clang_build.call(`environment.build_type = clang_build.build_type.BuildType.${result}\n`)
                        .then(() => {
                            vscode.window.showInformationMessage(`Set build type to "${result}"`);
                            status_clang_build_type.text = `clang-build: ${result}`;
                        });
                }
            });
        });

        let command_build = vscode.commands.registerCommand(buildCommandId, () => {
            vscode.window.showInformationMessage('Triggered a build!');

            outChannel.show();
            outChannel.appendLine('------ running clang-build');

            clang_build.call('project.build(environment.build_all, environment.target_list)\n')
                .then(() => {
                    outChannel.appendLine(`Full output of script:\n${clang_build.outputLog}`);
                    outChannel.appendLine('------ done running clang-build');
                });
        });

        let command_selectTargets = vscode.commands.registerCommand(targetSelectionCommandId, async () => {
            vscode.window.showInformationMessage('Selecting targets is not yet fully implemented!');

            await clang_build.call('target_list = " ".join([str(target) for target in project._get_targets_to_build(environment.build_all, environment.target_list)])\n');
            let targets = await clang_build.call('print(target_list)\n');
            let targets_array = targets.trim().split(" ");

            const result = await vscode.window.showQuickPick(
                targets_array,
                { placeHolder: 'target', }
            );
            if (result) {
                vscode.window.showInformationMessage(`Selected target "${result}"`);
                status_clang_build_targets.text = result;
            }
        });
    }
    // ---------------------------------------------------------------------

    status_clang_build_type.command = buildTypeCommandId;
    status_clang_build_type.text = `clang-build: Default`;
    status_clang_build_type.show();
    context.subscriptions.push(status_clang_build_type);

    status_clang_build_build.command = buildCommandId;
    status_clang_build_build.text = `build`;
    status_clang_build_build.show();
    context.subscriptions.push(status_clang_build_build);

    status_clang_build_targets.command = targetSelectionCommandId;
    status_clang_build_targets.text = `[all]`;
    status_clang_build_targets.show();
    context.subscriptions.push(status_clang_build_targets);

    outChannel.appendLine('vscode clang-build extension activated');
}

// this method is called when the extension is deactivated
export function deactivate() {}