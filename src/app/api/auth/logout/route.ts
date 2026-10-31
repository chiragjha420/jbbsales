import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully.' });
  response.cookies.delete('jbb_user_id');
  response.cookies.delete('jbb_user_role');
  return response;
}
