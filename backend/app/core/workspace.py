import uuid
import datetime
from typing import Dict, Any, List, Optional

class WorkspaceManager:
    """
    Manages user Workspaces containing source files, datasets, and saved artifacts.
    """
    def __init__(self):
        self.workspaces: Dict[str, Dict[str, Any]] = {}
        # Create default workspace
        self.create_workspace("Default Workspace", "Default CodePulse Intelligence Workspace")

    def create_workspace(self, name: str, description: str = "") -> Dict[str, Any]:
        ws_id = str(uuid.uuid4())
        ws = {
            "workspace_id": ws_id,
            "name": name,
            "description": description,
            "created_at": datetime.datetime.utcnow().isoformat() + "Z",
            "files": [],
            "datasets": [],
            "artifacts_count": 0
        }
        self.workspaces[ws_id] = ws
        return ws

    def list_workspaces(self) -> List[Dict[str, Any]]:
        return list(self.workspaces.values())

    def get_workspace(self, ws_id: str) -> Optional[Dict[str, Any]]:
        return self.workspaces.get(ws_id)
