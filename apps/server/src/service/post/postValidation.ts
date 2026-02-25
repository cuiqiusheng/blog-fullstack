import { normalizeRequiredText, normalizeOptionalText } from '@/service/shared/textNormalization';

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 100_000;
const MAX_TOPIC_LENGTH = 100;
const MAX_SUBTOPIC_LENGTH = 100;

const ALLOWED_CREATE_STATUSES = new Set(['DRAFT', 'PUBLISHED'] as const);

type AllowedCreateStatus = 'DRAFT' | 'PUBLISHED';

export interface CreatePostInput {
  title: string;
  content: string;
  topic?: string | null;
  subtopic?: string | null;
  status?: string | null;
}

export interface UpdatePostInput {
  title?: string | null;
  content?: string | null;
  topic?: string | null;
  subtopic?: string | null;
  status?: string | null;
}

export interface ValidatedCreatePostInput {
  title: string;
  content: string;
  topic?: string;
  subtopic?: string;
  status?: AllowedCreateStatus;
}

export interface ValidatedUpdatePostInput {
  title?: string;
  content?: string;
  topic?: string | null;
  subtopic?: string | null;
  status?: AllowedCreateStatus;
}

function validateTitle(title: string): string {
  const trimmed = normalizeRequiredText(title);
  if (!trimmed) {
    throw new Error('Title is required');
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new Error(`Title must be at most ${MAX_TITLE_LENGTH} characters`);
  }
  return trimmed;
}

function validateContent(content: string): string {
  const trimmed = normalizeRequiredText(content);
  if (!trimmed) {
    throw new Error('Content is required');
  }
  if (trimmed.length > MAX_CONTENT_LENGTH) {
    throw new Error(`Content must be at most ${MAX_CONTENT_LENGTH} characters`);
  }
  return trimmed;
}

function validateOptionalField(
  value: string | null | undefined,
  fieldName: string,
  maxLength: number,
): string | undefined {
  const normalized = normalizeOptionalText(value);
  if (normalized && normalized.length > maxLength) {
    throw new Error(`${fieldName} must be at most ${maxLength} characters`);
  }
  return normalized;
}

function validateStatus(status: string | null | undefined): AllowedCreateStatus | undefined {
  if (status == null) return undefined;
  if (!ALLOWED_CREATE_STATUSES.has(status as AllowedCreateStatus)) {
    throw new Error(`Invalid status: ${status}. Allowed values: DRAFT, PUBLISHED`);
  }
  return status as AllowedCreateStatus;
}

export function validateCreatePostInput(input: CreatePostInput): ValidatedCreatePostInput {
  const result: ValidatedCreatePostInput = {
    title: validateTitle(input.title),
    content: validateContent(input.content),
  };

  const topic = validateOptionalField(input.topic, 'Topic', MAX_TOPIC_LENGTH);
  if (topic) result.topic = topic;

  const subtopic = validateOptionalField(input.subtopic, 'Subtopic', MAX_SUBTOPIC_LENGTH);
  if (subtopic) result.subtopic = subtopic;

  const status = validateStatus(input.status);
  if (status) result.status = status;

  return result;
}

function validateClearableField(
  value: string | null | undefined,
  fieldName: string,
  maxLength: number,
): string | null | undefined {
  if (value === undefined) return undefined;
  const normalized = normalizeOptionalText(value);
  if (normalized && normalized.length > maxLength) {
    throw new Error(`${fieldName} must be at most ${maxLength} characters`);
  }
  return normalized ?? null;
}

export function validateUpdatePostInput(input: UpdatePostInput): ValidatedUpdatePostInput {
  const result: ValidatedUpdatePostInput = {};

  if (input.title != null) {
    result.title = validateTitle(input.title);
  }

  if (input.content != null) {
    result.content = validateContent(input.content);
  }

  const topic = validateClearableField(input.topic, 'Topic', MAX_TOPIC_LENGTH);
  if (topic !== undefined) result.topic = topic;

  const subtopic = validateClearableField(input.subtopic, 'Subtopic', MAX_SUBTOPIC_LENGTH);
  if (subtopic !== undefined) result.subtopic = subtopic;

  const status = validateStatus(input.status);
  if (status) result.status = status;

  return result;
}
