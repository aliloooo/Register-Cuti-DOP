-- Employees Table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    position TEXT,
    pn TEXT UNIQUE NOT NULL, -- Personal Number / ID
    team TEXT,
    tmt DATE NOT NULL, -- Terhitung Mulai Tanggal
    annual_leave_quota INTEGER DEFAULT 12,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leave Requests Table
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'approved', -- approved, pending, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Create Policies (Simplified for now - allow all for demonstration)
CREATE POLICY "Enable all for everyone" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for everyone" ON leave_requests FOR ALL USING (true) WITH CHECK (true);
