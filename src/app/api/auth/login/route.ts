import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    const validPassword = process.env.APP_PASSWORD || process.env.NEXT_PUBLIC_APP_PASSWORD || 'Del1Al9#';

    if (password === validPassword) {
      return NextResponse.json({
        success: true,
        message: 'Autenticación exitosa'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Contraseña incorrecta. Verifique e intente nuevamente.'
      }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error al verificar credenciales.'
    }, { status: 500 });
  }
}
