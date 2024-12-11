import { NextResponse } from 'next/server';
import { refreshAccessToken } from '../../../utils/refreshAccessToken';  // Đảm bảo bạn nhập đúng đường dẫn

export async function POST(req: Request) {
  try {
    const success = await refreshAccessToken();
    if (success) {
      return NextResponse.json({ message: 'Token refreshed successfully' });
    } else {
      return NextResponse.error();
    }
  } catch (error) {
    return NextResponse.error();
  }
}