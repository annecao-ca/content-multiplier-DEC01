# Document Versioning - Quick Reference ⚡

## 🚀 30-Second Start

```bash
# Run migration
psql -U postgres -d content_multiplier -f infra/migrations/008_document_versions.sql

# Test API
./test-document-versioning.sh
```

---

## 📝 API Quick Reference

### Upload Document (Auto-versioning)
```bash
POST /rag/documents
{
  "doc_id": "doc-123",
  "raw": "Content...",
  "createVersion": true  # Default: true
}
```

### Get All Versions
```bash
GET /rag/documents/:doc_id/versions
```

### Get Version Summary
```bash
GET /rag/documents/:doc_id/versions/summary
```

### Get Specific Version
```bash
GET /rag/documents/:doc_id/versions/:version_number
```

### Set Current Version
```bash
POST /rag/documents/:doc_id/versions/:version_number/set-current
```

### Delete Version
```bash
DELETE /rag/documents/:doc_id/versions/:version_number
```

---

## 💻 Code Examples

### Create Versions
```typescript
// Version 1
await upsertDocument({ doc_id: 'doc-123', raw: 'v1...' }, llm.embed);
// → v1

// Version 2 (automatic)
await upsertDocument({ doc_id: 'doc-123', raw: 'v2...' }, llm.embed);
// → v2
```

### View Versions
```typescript
const versions = await getDocumentVersions('doc-123');
// → [v2, v1]
```

### Set Current
```typescript
await setCurrentVersion('doc-123', 1);
// → Use v1 for search
```

---

## 📊 Version Structure

```
doc-123
  ├── v1 (version_id: doc-123-v1)
  ├── v2 (version_id: doc-123-v2)
  └── v3 (version_id: doc-123-v3)
```

---

## 🧪 Test

```bash
cd apps/api
tsx src/services/test-document-versioning.ts
```

---

## 📚 Full Docs

- **Guide**: `DOCUMENT_VERSIONING_GUIDE.md`
- **Summary**: `DOCUMENT_VERSIONING_SUMMARY.md`
- **Migration**: `infra/migrations/008_document_versions.sql`

---

## ✅ Done!

**Multiple versions, automatic numbering, full API!** 🎉





















