from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.committee import Committee, CommitteeMember
from app.utils.decorators import role_required

bp = Blueprint('committees', __name__, url_prefix='/api/committees')

@bp.route('/scholar/<int:scholar_id>', methods=['GET'])
@jwt_required()
def get_scholar_committee(scholar_id):
    """Get committee for a scholar"""
    committee = Committee.query.filter_by(scholar_id=scholar_id).first_or_404()
    return jsonify(committee.to_dict()), 200

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

    # Add ADC members
    for member_id in data.get('adc_members', []):
        member = CommitteeMember(
            committee_id=committee.id,
            supervisor_id=member_id,
            member_type='ADC'
        )
        db.session.add(member)

    db.session.commit()
    return jsonify(committee.to_dict()), 201
