from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from app_main.backup import BackupError, create_database_backup, list_database_backups
from app_main.permissions import IsSuperUser


class DatabaseBackupListCreateView(APIView):
    permission_classes = [IsSuperUser]

    def get(self, request):
        backups = [item.as_dict() for item in list_database_backups()]
        return Response({"backups": backups})

    def post(self, request):
        name = request.data.get("name", "")
        if name is None:
            name = ""
        if not isinstance(name, str):
            return Response(
                {"detail": "نام پشتیبان باید متن باشد."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            backup = create_database_backup(name.strip())
        except BackupError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(backup.as_dict(), status=status.HTTP_201_CREATED)
