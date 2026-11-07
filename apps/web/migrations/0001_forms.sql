-- News tips and advertising enquiries from the site's forms.
-- No IP addresses or device details are stored: tips can identify sources.

CREATE TABLE tips (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  tip TEXT NOT NULL,
  name TEXT,
  contact TEXT,
  anonymous INTEGER NOT NULL DEFAULT 0,
  -- JSON array of { key, name, size, type } for files in the TIP_FILES bucket
  files TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'new'
);
CREATE INDEX tips_created_at ON tips (created_at DESC);

CREATE TABLE ad_enquiries (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  budget TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'
);
CREATE INDEX ad_enquiries_created_at ON ad_enquiries (created_at DESC);
