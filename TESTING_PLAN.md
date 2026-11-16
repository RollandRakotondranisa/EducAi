# Testing Plan - Targeted Courses & Documents

## Test Scenarios

### Scenario A: Course with Document ✓
```
Enseignant A → Cours A → Étudiant 1 (ciblé) → Document A.pdf

Expected Result:
- Étudiant 1 can see Course A in their course list
- Click "Continuer l'apprentissage" → Course detail page
- Document A.pdf appears in the documents section
- Can read/download the document
```

**Test Steps:**
1. Login as TEACHER
2. Create course "Algorithme I" with code "ALG101"
3. Set target program/level for Étudiant 1
4. Upload document: "Introduction-Algorithmes.pdf"
5. Logout, Login as ÉTUDIANT 1
6. Check "Mes cours" - see "Algorithme I"
7. Click "Continuer l'apprentissage"
8. Verify document appears
9. Click "Lire" - document viewer opens
10. Click "Télécharger" - file downloads

### Scenario B: Access Control ✓
```
Étudiant 1 → Authorized ✓
Étudiant 2 → Not authorized ✗

Expected Result:
- Étudiant 1 can access course and documents
- Étudiant 2 cannot access course or documents
```

**Test Steps:**
1. Use Scenario A course
2. Logout, Login as ÉTUDIANT 2
3. Verify course NOT visible in course list
4. Try accessing `/api/courses/{courseA.id}` → Should get 403 error
5. Try accessing `/api/documents/{documentA.id}` → Should get 403 error

### Scenario C: Course Without Documents
```
Cours B → No documents

Expected Result:
- Course appears in student's list
- "Continue learning" button works
- Empty state message displayed: "Aucun document disponible"
- No errors
```

**Test Steps:**
1. Create course "Bases de Données I" with code "BD101"
2. Target to Étudiant 1
3. DON'T upload any documents
4. Login as Étudiant 1
5. Click course
6. Verify "Aucun document disponible" message
7. Verify back button works

### Scenario D: Multiple Documents
```
Cours C
├── Document 1 (PDF)
├── Document 2 (DOCX)
└── Document 3 (Image)

Expected Result:
- All 3 documents visible
- Each has view/download buttons
- Different file types display correctly
```

**Test Steps:**
1. Create course "Réseaux I" with code "RES101"
2. Upload 3 different document types
3. Login as Étudiant 1
4. Verify all documents appear
5. Test each document's view/download

## API Verification

### Backend Endpoints Modified
```
GET /api/courses
- Returns: Course with nested documents array
- Example response structure:
{
  id: 1,
  name: "Algorithme I",
  code: "ALG101",
  description: "...",
  teacher: { id, firstName, lastName, email },
  students: [...],
  documents: [
    {
      id: 1,
      originalName: "intro.pdf",
      fileSize: 102400,
      mimeType: "application/pdf",
      extension: ".pdf",
      status: "PROCESSED",
      createdAt: "2026-08-20T...",
      updatedAt: "2026-08-20T..."
    }
  ]
}
```

GET /api/courses/:id
- Returns: Single course with documents included

## Frontend Changes

### New Route
```
/etudiant/cours/:id → CourseDetail component
```

### Features
1. **Document List** - Shows all course documents
2. **Document Viewer** - Modal for viewing PDFs/images
3. **Download** - Secure document download with backend verification
4. **Empty State** - When course has no documents
5. **Navigation** - Back button to course list

## Security Verification

✓ Students can only view courses targeted to them
✓ Students can only access documents from their courses
✓ Teacher can only modify their own courses
✓ All permissions checked on backend
✓ Document download requires course access
✓ No direct file access without permission check

## Known Limitations

1. Document viewer supports: PDF, images, plain text
2. Other formats (DOCX, XLSX, etc.) - download only
3. Large PDFs may slow down viewer
4. No document version history in UI (exists in DB)

## Success Criteria

✅ All 4 scenarios pass
✅ No security vulnerabilities
✅ No console errors
✅ Responsive on mobile
✅ Permissions enforced on backend
✅ Documents appear with courses
✅ "Continue Learning" button fully functional
