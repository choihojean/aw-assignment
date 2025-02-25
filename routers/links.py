from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Link, LinkPermission, User
from schemas import LinkCreate, LinkUpdate, LinkResponse, LinkShareRequest
from routers.auth import get_current_user
from typing import List, Optional

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=LinkResponse)
def create_link(link: LinkCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_link = Link(created_by = current_user.id, name=link.name, url=link.url, category=link.category)
    db.add(new_link)
    db.commit()
    db.refresh(new_link)

    return new_link


@router.post("/{link_id}/share")
def share_link(link_id: int, share_data: LinkShareRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if share_data.username == current_user.username:
        raise HTTPException(status_code=400, detail="자신에게는 공유할 수 없습니다.")
    
    user_to_share = db.query(User).filter(User.username == share_data.username).first()
    if not user_to_share:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    link = db.query(Link).filter(Link.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="링크를 찾을 수 없습니다.")
    
    has_write_permission = db.query(LinkPermission).filter(
        LinkPermission.link_id == link_id,
        LinkPermission.user_id == current_user.id,
        LinkPermission.permission == "write"
    ).first()

    if link.created_by != current_user.id and not has_write_permission:
        raise HTTPException(status_code=403, detail="공유 권한이 없습니다.")

    #기존 권한 확인
    existing_permission = db.query(LinkPermission).filter(
        LinkPermission.link_id == link_id, 
        LinkPermission.user_id == user_to_share.id
    ).first()

    if existing_permission:
        existing_permission.permission = share_data.permission
    else:
        new_permission = LinkPermission(link_id=link_id, user_id=user_to_share.id, permission=share_data.permission)
        db.add(new_permission)
    
    db.commit()

    return {"message": "링크가 성공적으로 공유되었습니다."}

@router.post("/{link_id}/unshare")
def unshare_link(link_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    permission = db.query(LinkPermission).filter(
        LinkPermission.link_id == link_id, 
        LinkPermission.user_id == current_user.id
    ).first()

    if not permission:
        raise HTTPException(status_code=404, detail="공유받은 링크를 찾을 수 없습니다.")

    db.delete(permission)
    db.commit()

    return {"message": "공유받은 링크가 목록에서 제거되었습니다."}


@router.get("/", response_model=list[LinkResponse])
def get_links(db: Session = Depends(get_db), current_user: User = Depends(get_current_user), category: Optional[str] = Query(None, title="카테고리 필터")):

    query = db.query(Link).filter((Link.created_by == current_user.id) | 
                                  (Link.id.in_(db.query(LinkPermission.link_id).filter(LinkPermission.user_id == current_user.id))))
    
    if category and category != "전체":
        query = query.filter(Link.category == category)
    
    links = query.all()
    return links


@router.get("/{link_id}/permissions")
def get_link_permissions(link_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    permissions = db.query(LinkPermission).filter(LinkPermission.link_id == link_id).all()

    return permissions


@router.get("/search", response_model = List[LinkResponse])
def search_links(db: Session = Depends(get_db), current_user: User = Depends(get_current_user), 
                 query: Optional[str] = Query(None, title="검색", description="이름 또는 URL 검색"), category: Optional[str] = Query(None, title="카테고리", description="특정 카테고리")):
    filters = [Link.created_by == current_user.id]
    if query:
        filters.append(Link.name.ilike(f"%{query}%") | Link.url.ilike(f"%{query}"))
    if category:
        filters.append(Link.category == category)

    links = db.query(Link).filter(*filters).all()

    return links

#카테고리 가져오기
@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    own_categories = db.query(Link.category).filter(Link.created_by == current_user.id).distinct().all()
    shared_categories = db.query(Link.category).join(LinkPermission, Link.id == LinkPermission.link_id)\
                        .filter(LinkPermission.user_id == current_user.id).distinct().all()
    
    #중복 제거
    categories = list(set([category[0] for category in own_categories + shared_categories]))
    
    return categories


@router.put("/{link_id}", response_model=LinkResponse)
def update_link(link_id: int, link_data: LinkUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    link = db.query(Link).filter(Link.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="링크를 찾을 수 없습니다.")
    
    has_write_permission = db.query(LinkPermission).filter(
        LinkPermission.link_id == link_id,
        LinkPermission.user_id == current_user.id,
        LinkPermission.permission == "write"
    ).first()

    if link.created_by != current_user.id:
        if not has_write_permission:
            raise HTTPException(status_code=403, detail="수정 권한이 없습니다")
    
    for key, value in link_data.dict(exclude_unset=True).items():
        setattr(link, key, value)
    db.commit()
    db.refresh(link)
    
    return link


@router.delete("/{link_id}")
def delete_link(link_id: int, db:Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    link = db.query(Link).filter(Link.id == link_id, Link.created_by == current_user.id).first()
    if not link:
        raise HTTPException(status_code=404, detail="링크를 찾을 수 없거나 삭제할 수 없습니다.")
    
    db.delete(link)
    db.commit()
    
    return {"message":"링크가 성공적으로 삭제되었습니다."}



