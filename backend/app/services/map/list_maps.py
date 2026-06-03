from app.services.map._core import *


def list_maps(campaign_id: int, current_user: User, db: Session) -> List[MapItem]:
    require_map_access(campaign_id, current_user, db)
    maps_dir = campaign_maps_dir(campaign_id)
    if not os.path.exists(maps_dir):
        return []

    maps = []
    for filename in os.listdir(maps_dir):
        if os.path.isfile(os.path.join(maps_dir, filename)):
            maps.append(MapItem(id=filename, filename=filename))
    return maps
