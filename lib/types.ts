export interface Comment {
  id: string;
  submission_id: string;
  author_email: string | null;
  content: string;
  created_at: string;
}

export interface Submission {
  id: string;
  title: string;
  description: string;
  presenter_name: string;
  links: string[] | null;
  vote_count: number;
  comment_count?: number;
  submission_type: "speaker_demo" | "topic";
  submitted_by: "human" | "bot" | "bot_on_behalf";
  submitted_for_name: string | null;
  is_openclaw_contributor: boolean;
  created_at?: string;
}
