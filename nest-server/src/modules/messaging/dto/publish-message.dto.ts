// Kept as a plain typed class (no class-validator) since that library isn't
// installed in this project yet. Add it separately if request validation
// needs to be enforced across the API, not just for this endpoint.
export class PublishMessageDto {
  payload!: Record<string, unknown>;
  messageGroupId?: string;
}
