from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.committee import Committee, CommitteeMember
from app.models.scholar import Scholar
from app.utils.decorators import role_required, get_current_user

bp = Blueprint('committees', __name__, url_prefix='/api/committees')

@bp.route('/scholar/<int:scholar_id>', methods=['GET'])
@jwt_required()
def get_scholar_committee(scholar_id):
    """Get committee for a scholar"""
    committee = Committee.query.filter_by(scholar_id=scholar_id).first_or_404()
    return jsonify(committee.to_dict()), 200


@bp.route('/my-committee-scholars', methods=['GET'])
@jwt_required()
@role_required('supervisor')
def get_my_committee_scholars():
    """Get list of scholars where current user is a committee member (Doctoral or Academic Progress)"""
    current_user = get_current_user()
    
    if not current_user.supervisor_profile:
        return jsonify({'error': 'Supervisor profile not found'}), 404
    
    # Find all committee memberships for this supervisor (DC or APC)
    committee_memberships = CommitteeMember.query.filter_by(
        supervisor_id=current_user.supervisor_profile.id,
        is_active=True
    ).filter(CommitteeMember.member_type.in_(['DC', 'APC'])).all()
    
    scholars_data = []
    for membership in committee_memberships:
        committee = Committee.query.get(membership.committee_id)
        if committee:
            scholar = Scholar.query.get(committee.scholar_id)
            if scholar:
                scholar_info = scholar.to_dict(include_relations=True)
                scholar_info['committee_role'] = membership.member_type
                scholar_info['committee_role_display'] = 'Doctoral Committee' if membership.member_type == 'DC' else 'Academic Progress Committee'
                scholar_info['assigned_date'] = membership.assigned_date.isoformat() if membership.assigned_date else None
                scholars_data.append(scholar_info)
    
    return jsonify(scholars_data), 200


@bp.route('/my-dc-scholars', methods=['GET'])
@jwt_required()
@role_required('supervisor')
def get_my_dc_scholars():
    """Get list of scholars where current user is a Doctoral Committee member"""
    current_user = get_current_user()
    
    if not current_user.supervisor_profile:
        return jsonify({'error': 'Supervisor profile not found'}), 404
    
    # Find all DC memberships for this supervisor
    committee_memberships = CommitteeMember.query.filter_by(
        supervisor_id=current_user.supervisor_profile.id,
        member_type='DC',
        is_active=True
    ).all()
    
    scholars_data = []
    for membership in committee_memberships:
        committee = Committee.query.get(membership.committee_id)
        if committee:
            scholar = Scholar.query.get(committee.scholar_id)
            if scholar:
                scholar_info = scholar.to_dict(include_relations=True)
                scholar_info['committee_role'] = 'DC'
                scholar_info['assigned_date'] = membership.assigned_date.isoformat() if membership.assigned_date else None
                scholars_data.append(scholar_info)
    
    return jsonify(scholars_data), 200


@bp.route('/my-apc-scholars', methods=['GET'])
@jwt_required()
@role_required('supervisor')
def get_my_apc_scholars():
    """Get list of scholars where current user is an Academic Progress Committee member"""
    current_user = get_current_user()
    
    if not current_user.supervisor_profile:
        return jsonify({'error': 'Supervisor profile not found'}), 404
    
    # Find all APC memberships for this supervisor
    committee_memberships = CommitteeMember.query.filter_by(
        supervisor_id=current_user.supervisor_profile.id,
        member_type='APC',
        is_active=True
    ).all()
    
    scholars_data = []
    for membership in committee_memberships:
        committee = Committee.query.get(membership.committee_id)
        if committee:
            scholar = Scholar.query.get(committee.scholar_id)
            if scholar:
                scholar_info = scholar.to_dict(include_relations=True)
                scholar_info['committee_role'] = 'APC'
                scholar_info['assigned_date'] = membership.assigned_date.isoformat() if membership.assigned_date else None
                scholars_data.append(scholar_info)
    
    return jsonify(scholars_data), 200


@bp.route('/', methods=['POST'])
@jwt_required()
@role_required('dean_academics')
def create_committee():
    """Create committee for scholar (Dean only)"""
    data = request.get_json()

    committee = Committee(scholar_id=data['scholar_id'])
    db.session.add(committee)
    db.session.flush()

    # Add DC members
    for member_id in data.get('dc_members', []):
        member = CommitteeMember(
            committee_id=committee.id,
            supervisor_id=member_id,
            member_type='DC'
        )
        db.session.add(member)

    # Add APC members
    for member_id in data.get('apc_members', []):
        member = CommitteeMember(
            committee_id=committee.id,
            supervisor_id=member_id,
            member_type='APC'
        )
        db.session.add(member)

    # Add ADC members (deprecated but keeping for backward compatibility)
    for member_id in data.get('adc_members', []):
        member = CommitteeMember(
            committee_id=committee.id,
            supervisor_id=member_id,
            member_type='ADC'
        )
        db.session.add(member)

    db.session.commit()
    return jsonify(committee.to_dict()), 201
