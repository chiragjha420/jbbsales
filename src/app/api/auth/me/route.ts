import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get('jbb_user_id')?.value;

    if (!userId) {
      // Default to Rahul for immediate seamless preview if not logged in
      const defaultUser = await repository.getProfileByEmail('rahul@jbb.in');
      return NextResponse.json({ user: defaultUser });
    }

    const user = await repository.getProfileById(userId);
    if (!user || !user.active) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
