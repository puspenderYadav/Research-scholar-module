"""
Unified Approvals API
Centralized endpoint for all approval requests across different modules
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.travel_grant import TravelGrant
from app.models.progress_report import ProgressReport
from app.models.synopsis import Synopsis
from app.models.thesis import Thesis
from app.models.leave import Leave
from app.models.comprehensive_exam import ComprehensiveExam
from app.models.supervisor_change_request import SupervisorChangeRequest
from app.models.scholar import Scholar
from app.models.committee import Committee, CommitteeMember
from app.utils.decorators import get_current_user
from datetime import datetime

bp = Blueprint('approvals', __name__, url_prefix='/api/approvals')


def get_approval_role_for_request(current_user, request_type, item):
    """
    Determine the user's approval role for a specific request
    Returns: (role_name, can_approve, stage_info)
    """
    role = current_user.role

    if request_type == 'travel_grant':
        stage = item.current_stage
        if role == 'supervisor' and stage == 'supervisor':
            # Check if direct supervisor
            if item.scholar.supervisor_id == current_user.supervisor_profile.id:
                return ('Supervisor', True, 'Supervisor Review')
        elif role == 'supervisor' and stage == 'dc':
            # Check if DC member
            if item.scholar.committee:
                dc_member_ids = [m.supervisor_id for m in item.scholar.committee.get_dc_members()]
                if current_user.supervisor_profile.id in dc_member_ids:
                    return ('DC Member', True, 'Doctoral Committee Review')
        elif role == 'school_chair' and stage == 'school_chair':
            return ('School Chair', True, 'School Chair Approval')
        elif role == 'ad_research' and stage == 'ad_research':
            return ('AD Research', True, 'Research Office Review')
        elif role == 'dean_academics' and stage == 'dean_academics':
            return ('Dean Academics', True, 'Final Approval')
        return (role, False, stage)

    elif request_type == 'progress_report':
        # Progress reports go through APC members sequentially
        stage = item.current_stage  # ProgressReport uses current_stage, not current_approval_stage
        if stage == 'dc_apc':
            approvals = item.approvals.all()
            pending_approvers = item.get_pending_approvers()

            if role == 'supervisor' and current_user.supervisor_profile:
                if current_user.supervisor_profile.id in pending_approvers:
                    return ('APC Member', True, f'APC Review ({len(approvals) + 1} of {len(item.get_apc_members())})')
        elif stage == 'school_chair' and role == 'school_chair':
            return ('School Chair', True, 'School Chair Approval')
        elif stage == 'ad_research' and role == 'ad_research':
            return ('AD Research', True, 'Research Office Review')
        elif stage == 'dean_academics' and role == 'dean_academics':
            return ('Dean Academics', True, 'Final Approval')
        return (role, False, stage)

    elif request_type == 'synopsis':
        stage = item.current_stage  # Synopsis uses current_stage
        if role == 'supervisor' and stage == 'supervisor':
            if item.scholar.supervisor_id == current_user.supervisor_profile.id:
                return ('Supervisor', True, 'Supervisor Review')
        elif role == 'supervisor' and stage == 'dc_apc':
            if item.scholar.committee:
                dc_member_ids = [m.supervisor_id for m in item.scholar.committee.get_dc_members()]
                if current_user.supervisor_profile.id in dc_member_ids:
                    return ('DC Member', True, 'Doctoral Committee Review')
        elif role == 'school_chair' and stage == 'school_chair':
            return ('School Chair', True, 'School Chair Approval')
        elif role == 'ad_research' and stage == 'ad_research':
            return ('AD Research', True, 'Research Office Review')
        elif role == 'dean_academics' and stage == 'dean_academics':
            return ('Dean Academics', True, 'Final Approval')
        return (role, False, stage)

    elif request_type == 'thesis':
        stage = item.current_stage  # Thesis uses current_stage
        if role == 'supervisor' and stage == 'dc_apc':
            if item.scholar.committee:
                dc_member_ids = [m.supervisor_id for m in item.scholar.committee.get_dc_members()]
                if current_user.supervisor_profile.id in dc_member_ids:
                    return ('DC Member', True, 'Doctoral Committee Review')
        elif role == 'school_chair' and stage == 'school_chair':
            return ('School Chair', True, 'School Chair Approval')
        elif role == 'supervisor' and stage == 'apc':
            # APC stage for thesis - check if user is APC member
            if item.scholar.committee:
                apc_member_ids = [m.supervisor_id for m in item.scholar.committee.get_apc_members()]
                if current_user.supervisor_profile and current_user.supervisor_profile.id in apc_member_ids:
                    return ('APC Member', True, 'Academic Progress Committee Review')
        elif role == 'ad_research' and stage == 'ad_research':
            return ('AD Research', True, 'Research Office Review')
        elif role == 'dean_academics' and stage == 'dean_academics':
            return ('Dean Academics', True, 'Final Approval')
        return (role, False, stage)

    elif request_type == 'leave':
        if role == 'supervisor' and item.status == 'pending':
            if item.scholar.supervisor_id == current_user.supervisor_profile.id:
                return ('Supervisor', True, 'Supervisor Approval')
        elif role == 'school_chair' and item.supervisor_approved and not item.school_chair_approved:
            return ('School Chair', True, 'School Chair Approval')
        return (role, False, 'Pending')

    elif request_type == 'comprehensive_exam':
        if role == 'supervisor' and item.status == 'pending':
            if item.scholar.supervisor_id == current_user.supervisor_profile.id:
                return ('Supervisor', True, 'Supervisor Approval')
        elif role == 'ad_research' and item.status == 'supervisor_approved':
            return ('AD Research', True, 'Research Office Approval')
        return (role, False, item.status)

    elif request_type == 'supervisor_change':
        if role == 'supervisor':
            if not item.current_supervisor_approved and item.current_supervisor_id == current_user.supervisor_profile.id:
                return ('Current Supervisor', True, 'Current Supervisor Approval')
            elif item.current_supervisor_approved and not item.new_supervisor_approved and item.new_supervisor_id == current_user.supervisor_profile.id:
                return ('Proposed Supervisor', True, 'New Supervisor Approval')
        elif role == 'dean_academics' and item.current_supervisor_approved and item.new_supervisor_approved and not item.dean_approved:
            return ('Dean Academics', True, 'Final Approval')
        return (role, False, item.status)

    return (role, False, 'Unknown')


@bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_approvals():
    """
    Get all pending approvals for the current user across all modules
    Returns a unified list with request type, details, and approval actions
    """
    current_user = get_current_user()
    all_approvals = []

    # 1. Travel Grants
    try:
        travel_grants = TravelGrant.query.filter(
            TravelGrant.status.in_(['submitted', 'under_review'])
        ).all()

        for grant in travel_grants:
            role_name, can_approve, stage_info = get_approval_role_for_request(
                current_user, 'travel_grant', grant
            )

            if can_approve:
                all_approvals.append({
                    'id': grant.id,
                    'type': 'travel_grant',
                    'type_label': 'Travel Grant',
                    'title': grant.event_name,
                    'scholar_name': grant.scholar.user.name if grant.scholar and grant.scholar.user else 'Unknown',
                    'scholar_enrollment': grant.scholar.enrollment_number if grant.scholar else 'N/A',
                    'submitted_date': grant.submission_date.isoformat() if grant.submission_date else None,
                    'status': grant.status,
                    'current_stage': grant.current_stage,
                    'my_role': role_name,
                    'stage_info': stage_info,
                    'details': {
                        'grant_type': grant.grant_type,
                        'venue_country': grant.venue_country,
                        'start_date': grant.start_date.isoformat() if grant.start_date else None,
                        'end_date': grant.end_date.isoformat() if grant.end_date else None,
                        'anticipated_expenses': float(grant.anticipated_expenses) if grant.anticipated_expenses else 0,
                        'reasons_for_visit': grant.reasons_for_visit,
                    },
                    'actions': ['approve', 'reject'],
                    'approval_endpoint': f'/travel-grants/{grant.id}/approve',
                    'view_link': f'/travel-grants?id={grant.id}'
                })
    except Exception as e:
        print(f"Error fetching travel grants: {e}")

    # 2. Progress Reports
    try:
        progress_reports = ProgressReport.query.filter(
            ProgressReport.status.in_(['submitted', 'under_review'])
        ).all()

        for report in progress_reports:
            role_name, can_approve, stage_info = get_approval_role_for_request(
                current_user, 'progress_report', report
            )

            if can_approve:
                all_approvals.append({
                    'id': report.id,
                    'type': 'progress_report',
                    'type_label': 'Progress Report',
                    'title': f'Progress Report - {report.year}',
                    'scholar_name': report.scholar.user.name if report.scholar and report.scholar.user else 'Unknown',
                    'scholar_enrollment': report.scholar.enrollment_number if report.scholar else 'N/A',
                    'submitted_date': report.submission_date.isoformat() if report.submission_date else None,
                    'status': report.status,
                    'current_stage': report.current_approval_stage,
                    'my_role': role_name,
                    'stage_info': stage_info,
                    'details': {
                        'year': report.year,
                        'research_progress': report.research_progress[:200] + '...' if report.research_progress and len(report.research_progress) > 200 else report.research_progress,
                        'publications': report.publications,
                    },
                    'actions': ['approve', 'reject'],
                    'approval_endpoint': f'/progress-reports/{report.id}/approve',
                    'view_link': f'/progress-reports?id={report.id}'
                })
    except Exception as e:
        print(f"Error fetching progress reports: {e}")

    # 3. Synopsis
    try:
        synopsis_list = Synopsis.query.filter(
            Synopsis.status.in_(['submitted', 'under_review'])
        ).all()

        for synopsis in synopsis_list:
            role_name, can_approve, stage_info = get_approval_role_for_request(
                current_user, 'synopsis', synopsis
            )

            if can_approve:
                all_approvals.append({
                    'id': synopsis.id,
                    'type': 'synopsis',
                    'type_label': 'Synopsis',
                    'title': synopsis.thesis_title or 'Synopsis Submission',
                    'scholar_name': synopsis.scholar.user.name if synopsis.scholar and synopsis.scholar.user else 'Unknown',
                    'scholar_enrollment': synopsis.scholar.enrollment_number if synopsis.scholar else 'N/A',
                    'submitted_date': synopsis.submission_date.isoformat() if synopsis.submission_date else None,
                    'status': synopsis.status,
                    'current_stage': synopsis.current_approval_stage,
                    'my_role': role_name,
                    'stage_info': stage_info,
                    'details': {
                        'thesis_title': synopsis.thesis_title,
                        'abstract': synopsis.abstract[:200] + '...' if synopsis.abstract and len(synopsis.abstract) > 200 else synopsis.abstract,
                    },
                    'actions': ['approve', 'reject'],
                    'approval_endpoint': f'/synopsis/{synopsis.id}/approve',
                    'view_link': f'/synopsis?id={synopsis.id}'
                })
    except Exception as e:
        print(f"Error fetching synopsis: {e}")

    # 4. Thesis
    try:
        thesis_list = Thesis.query.filter(
            Thesis.status.in_(['submitted', 'under_review'])
        ).all()

        for thesis in thesis_list:
            role_name, can_approve, stage_info = get_approval_role_for_request(
                current_user, 'thesis', thesis
            )

            if can_approve:
                all_approvals.append({
                    'id': thesis.id,
                    'type': 'thesis',
                    'type_label': 'Thesis',
                    'title': thesis.title or 'Thesis Submission',
                    'scholar_name': thesis.scholar.user.name if thesis.scholar and thesis.scholar.user else 'Unknown',
                    'scholar_enrollment': thesis.scholar.enrollment_number if thesis.scholar else 'N/A',
                    'submitted_date': thesis.submission_date.isoformat() if thesis.submission_date else None,
                    'status': thesis.status,
                    'current_stage': thesis.current_approval_stage,
                    'my_role': role_name,
                    'stage_info': stage_info,
                    'details': {
                        'title': thesis.title,
                        'abstract': thesis.abstract[:200] + '...' if thesis.abstract and len(thesis.abstract) > 200 else thesis.abstract,
                    },
                    'actions': ['approve', 'reject'],
                    'approval_endpoint': f'/thesis/{thesis.id}/approve',
                    'view_link': f'/thesis?id={thesis.id}'
                })
    except Exception as e:
        print(f"Error fetching thesis: {e}")

    # 5. Leave Applications
    try:
        if current_user.role == 'supervisor':
            leaves = Leave.query.join(Scholar).filter(
                Scholar.supervisor_id == current_user.supervisor_profile.id,
                Leave.status == 'submitted'
            ).all()
        elif current_user.role == 'school_chair':
            leaves = Leave.query.filter(
                Leave.supervisor_approved == True,
                Leave.school_chair_approved == False,
                Leave.status == 'under_review'
            ).all()
        else:
            leaves = []

        for leave in leaves:
            role_name, can_approve, stage_info = get_approval_role_for_request(
                current_user, 'leave', leave
            )

            if can_approve:
                all_approvals.append({
                    'id': leave.id,
                    'type': 'leave',
                    'type_label': 'Leave Application',
                    'title': f'{leave.leave_type} Leave',
                    'scholar_name': leave.scholar.user.name if leave.scholar and leave.scholar.user else 'Unknown',
                    'scholar_enrollment': leave.scholar.enrollment_number if leave.scholar else 'N/A',
                    'submitted_date': leave.created_at.isoformat() if leave.created_at else None,
                    'status': leave.status,
                    'current_stage': 'supervisor' if not leave.supervisor_approved else 'school_chair',
                    'my_role': role_name,
                    'stage_info': stage_info,
                    'details': {
                        'leave_type': leave.leave_type,
                        'start_date': leave.start_date.isoformat() if leave.start_date else None,
                        'end_date': leave.end_date.isoformat() if leave.end_date else None,
                        'total_days': leave.total_days,
                        'reason': leave.reason,
                    },
                    'actions': ['approve', 'reject'],
                    'approval_endpoint': f'/leaves/{leave.id}/approve',
                    'view_link': f'/leave-applications?id={leave.id}'
                })
    except Exception as e:
        print(f"Error fetching leaves: {e}")

    # 6. Comprehensive Exams
    try:
        if current_user.role == 'supervisor':
            exams = ComprehensiveExam.query.join(Scholar).filter(
                Scholar.supervisor_id == current_user.supervisor_profile.id,
                ComprehensiveExam.status == 'pending'
            ).all()
        elif current_user.role == 'ad_research':
            exams = ComprehensiveExam.query.filter(
                ComprehensiveExam.status == 'supervisor_approved'
            ).all()
        else:
            exams = []

        for exam in exams:
            role_name, can_approve, stage_info = get_approval_role_for_request(
                current_user, 'comprehensive_exam', exam
            )

            if can_approve:
                all_approvals.append({
                    'id': exam.id,
                    'type': 'comprehensive_exam',
                    'type_label': 'Comprehensive Exam',
                    'title': 'Comprehensive Exam Request',
                    'scholar_name': exam.scholar.user.name if exam.scholar and exam.scholar.user else 'Unknown',
                    'scholar_enrollment': exam.scholar.enrollment_number if exam.scholar else 'N/A',
                    'submitted_date': exam.created_at.isoformat() if exam.created_at else None,
                    'status': exam.status,
                    'current_stage': 'supervisor' if exam.status == 'pending' else 'ad_research',
                    'my_role': role_name,
                    'stage_info': stage_info,
                    'details': {
                        'scheduled_date': exam.scheduled_date.isoformat() if exam.scheduled_date else None,
                        'venue': exam.venue,
                    },
                    'actions': ['approve', 'reject'],
                    'approval_endpoint': f'/comprehensive-exams/{exam.id}/approve',
                    'view_link': f'/comprehensive-exams?id={exam.id}'
                })
    except Exception as e:
        print(f"Error fetching comprehensive exams: {e}")

    # 7. Supervisor Change Requests
    try:
        if current_user.role == 'supervisor':
            requests = SupervisorChangeRequest.query.filter(
                db.or_(
                    db.and_(
                        SupervisorChangeRequest.current_supervisor_id == current_user.supervisor_profile.id,
                        SupervisorChangeRequest.current_supervisor_approved == False
                    ),
                    db.and_(
                        SupervisorChangeRequest.new_supervisor_id == current_user.supervisor_profile.id,
                        SupervisorChangeRequest.current_supervisor_approved == True,
                        SupervisorChangeRequest.new_supervisor_approved == False
                    )
                ),
                SupervisorChangeRequest.status == 'pending'
            ).all()
        elif current_user.role == 'dean_academics':
            requests = SupervisorChangeRequest.query.filter(
                SupervisorChangeRequest.current_supervisor_approved == True,
                SupervisorChangeRequest.new_supervisor_approved == True,
                SupervisorChangeRequest.dean_approved == False,
                SupervisorChangeRequest.status == 'pending'
            ).all()
        else:
            requests = []

        for req in requests:
            role_name, can_approve, stage_info = get_approval_role_for_request(
                current_user, 'supervisor_change', req
            )

            if can_approve:
                all_approvals.append({
                    'id': req.id,
                    'type': 'supervisor_change',
                    'type_label': 'Supervisor Change',
                    'title': 'Supervisor Change Request',
                    'scholar_name': req.scholar.user.name if req.scholar and req.scholar.user else 'Unknown',
                    'scholar_enrollment': req.scholar.enrollment_number if req.scholar else 'N/A',
                    'submitted_date': req.created_at.isoformat() if req.created_at else None,
                    'status': req.status,
                    'current_stage': 'current_supervisor' if not req.current_supervisor_approved else ('new_supervisor' if not req.new_supervisor_approved else 'dean'),
                    'my_role': role_name,
                    'stage_info': stage_info,
                    'details': {
                        'current_supervisor': req.current_supervisor.user.name if req.current_supervisor else 'N/A',
                        'new_supervisor': req.new_supervisor.user.name if req.new_supervisor else 'N/A',
                        'reason': req.reason,
                    },
                    'actions': ['approve', 'reject'],
                    'approval_endpoint': f'/supervisor-change/{req.id}/approve-{role_name.lower().replace(" ", "-")}',
                    'view_link': f'/supervisor-change?id={req.id}'
                })
    except Exception as e:
        print(f"Error fetching supervisor change requests: {e}")

    # Sort by submission date (most recent first)
    all_approvals.sort(key=lambda x: x['submitted_date'] if x['submitted_date'] else '', reverse=True)

    return jsonify({
        'total': len(all_approvals),
        'approvals': all_approvals
    }), 200


@bp.route('/summary', methods=['GET'])
@jwt_required()
def get_approvals_summary():
    """Get summary count of pending approvals by type"""
    current_user = get_current_user()

    summary = {
        'travel_grants': 0,
        'progress_reports': 0,
        'synopsis': 0,
        'thesis': 0,
        'leaves': 0,
        'comprehensive_exams': 0,
        'supervisor_changes': 0,
        'total': 0
    }

    # Get all approvals and count by type
    response = get_all_approvals()
    data = response[0].get_json()

    for approval in data['approvals']:
        approval_type = approval['type']
        if approval_type in summary:
            summary[approval_type] += 1

    summary['total'] = data['total']

    return jsonify(summary), 200
