import * as vscode from 'vscode';

class TreeItem extends vscode.TreeItem {
    children: TreeItem[] | undefined;

    constructor(label: string, children?: TreeItem[]) {
        super(
            label,
            children === undefined ? vscode.TreeItemCollapsibleState.None :
                vscode.TreeItemCollapsibleState.Expanded);
        this.children = children;
    }
}

export class ProjectTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
    readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

    private _clang_build: any;
    private _data: TreeItem[];

    private async _get_project_tree(): Promise<TreeItem[]> {
        console.log(">>-- ProjectTreeDataProvider");
        await this._clang_build.call('target_list = " ".join([str(target.name) for target in project.target_list])\n');
        await this._clang_build.call('subproject_list = " ".join([str(project.name) for project in project.subprojects])\n');

        let project: string = await this._clang_build.call('print(str(project))\n');
        let project_targets_str: string = await this._clang_build.call('print(target_list)\n');
        let project_targets_array: TreeItem[] = project_targets_str.trim().split(" ").map(name => new TreeItem(name));

        let subproject: string = await this._clang_build.call('print(project.subprojects[0].name)\n');
        let subproject_targets_str: string = await this._clang_build.call('print(" ".join([str(target.name) for target in  project.subprojects[0].target_list]))\n');
        let subproject_targets_array: TreeItem[] = subproject_targets_str.trim().split(" ").map(name => new TreeItem(name));

        let subprojects_array: string[] = subproject.trim().split(" ");

        console.log(">>-- project:", project);
        console.log(">>-- project_targets:", project_targets_array);
        console.log(">>-- subproject:", subprojects_array);
        console.log(">>-- subproject_targets:", subproject_targets_array);

        let ret = project_targets_array.concat([
            new TreeItem(subproject, subproject_targets_array)
        ]);
        console.log(">>-- ProjectTreeDataProvider done");
        this._onDidChangeTreeData.fire(null);
        return ret;
    }

    constructor(clang_build_process: any) {
        this._clang_build = clang_build_process;

        this._data = [
            new TreeItem('cars', [
                new TreeItem(
                    'Ford', [new TreeItem('Fiesta'), new TreeItem('Focus'), new TreeItem('Mustang')]),
                new TreeItem(
                    'BMW', [new TreeItem('320'), new TreeItem('X3'), new TreeItem('X5')])
            ])
        ];

        this._get_project_tree().then((result) => {
            this._data = result;
        });
    }

    public getTreeItem(element: TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    public getChildren(element?: TreeItem | undefined): vscode.ProviderResult<TreeItem[]> {
        if (element === undefined) {
            return this._data;
        }
        return element.children;
    }

    public refresh(): any {
        this._onDidChangeTreeData.fire(null);
    }
}

export class ProjectExplorer {

    private _projectViewer: vscode.TreeView<vscode.TreeItem>;
    private _clang_build: any;

    private async setTitle() {
        let project_name = await this._clang_build.call('print(str(project))\n');
        this._projectViewer.title = project_name;
    }

    constructor(context: vscode.ExtensionContext, clang_build_process: any) {
        this._clang_build = clang_build_process;

        const treeDataProvider = new ProjectTreeDataProvider(clang_build_process);
        treeDataProvider.onDidChangeTreeData((event) => {
            this.setTitle();
        });

        this._projectViewer = vscode.window.createTreeView('project-explorer-projects', { treeDataProvider });
    }
}