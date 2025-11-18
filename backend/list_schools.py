"""
List all schools and their chairs
"""
from app import create_app, db
from app.models.school import School

app = create_app()

with app.app_context():
    print("\n" + "="*70)
    print("ALL SCHOOLS IN DATABASE")
    print("="*70)
    
    schools = School.query.all()
    
    if not schools:
        print("\nNo schools found in database")
    else:
        for school in schools:
            status = "DELETED" if school.is_deleted else "ACTIVE"
            chair_info = f"{school.chair.name} ({school.chair.email})" if school.chair else "No chair"
            
            print(f"\n[{status}] {school.name} ({school.code})")
            print(f"  ID: {school.id}")
            print(f"  Chair: {chair_info}")
            if school.is_deleted:
                print(f"  Deleted at: {school.deleted_at}")
    
    print("\n" + "="*70)
    print(f"Total: {len(schools)} schools")
    active_count = len([s for s in schools if not s.is_deleted])
    print(f"Active: {active_count} schools")
    print("="*70)

